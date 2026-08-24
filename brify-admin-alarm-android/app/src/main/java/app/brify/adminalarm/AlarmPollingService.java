package app.brify.adminalarm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class AlarmPollingService extends Service {
    static final String ACTION_START = "app.brify.adminalarm.START";
    static final String ACTION_STOP_SERVICE = "app.brify.adminalarm.STOP_SERVICE";
    static final String ACTION_STOP_SOUND = "app.brify.adminalarm.STOP_SOUND";
    static final String ACTION_TEST_ALARM = "app.brify.adminalarm.TEST_ALARM";
    static final String ACTION_ACK_ALL = "app.brify.adminalarm.ACK_ALL";

    private static final String TAG = "BrifyAdminAlarm";
    private static final String WAITING_CHANNEL_ID = "brify_admin_alarm_waiting";
    private static final String ALERT_CHANNEL_ID = "brify_admin_alarm_alert";
    private static final int WAITING_NOTIFICATION_ID = 2401;
    private static final int ALERT_NOTIFICATION_ID = 2402;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Set<String> seenAlertIds = Collections.synchronizedSet(new HashSet<>());
    private final Set<String> activeAlertIds = Collections.synchronizedSet(new HashSet<>());

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private boolean isPolling = false;
    private boolean pollInFlight = false;
    private String lastAlertSummary = "새 요청 없음";

    private final Runnable pollRunnable = new Runnable() {
        @Override
        public void run() {
            if (!isPolling) return;
            pollOnce();
            handler.postDelayed(this, getPollingIntervalMs());
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_START;
        startForeground(WAITING_NOTIFICATION_ID, buildWaitingNotification("대기중", lastAlertSummary));

        if (ACTION_STOP_SERVICE.equals(action)) {
            stopAlarmSound();
            isPolling = false;
            handler.removeCallbacksAndMessages(null);
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_STOP_SOUND.equals(action)) {
            stopAlarmSound();
            return START_STICKY;
        }

        if (ACTION_TEST_ALARM.equals(action)) {
            startAlarm("테스트 알람", "Brify 관리자 알람 테스트입니다.");
            ensurePollingStarted();
            return START_STICKY;
        }

        if (ACTION_ACK_ALL.equals(action)) {
            stopAlarmSound();
            acknowledgeActiveAlerts();
            return START_STICKY;
        }

        ensurePollingStarted();
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopAlarmSound();
        handler.removeCallbacksAndMessages(null);
        executor.shutdownNow();
        super.onDestroy();
    }

    private void ensurePollingStarted() {
        if (isPolling) return;
        isPolling = true;
        handler.post(pollRunnable);
    }

    private void pollOnce() {
        if (pollInFlight) return;
        pollInFlight = true;
        executor.execute(() -> {
            try {
                JSONArray alerts = fetchAlerts();
                for (int i = 0; i < alerts.length(); i++) {
                    JSONObject alert = alerts.getJSONObject(i);
                    String id = alert.optString("id", "");
                    if (id.isEmpty() || seenAlertIds.contains(id)) continue;
                    seenAlertIds.add(id);
                    activeAlertIds.add(id);
                    String email = alert.optString("email", "unknown");
                    String language = alert.optString("outputLanguage", "auto");
                    String url = alert.optString("url", "");
                    lastAlertSummary = "요청자: " + email + " / 언어: " + language;
                    handler.post(() -> startAlarm(
                            "새 YouTube 구조맵 요청",
                            lastAlertSummary + "\n" + url
                    ));
                }
                handler.post(() -> {
                    NotificationManager manager =
                            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                    manager.notify(
                            WAITING_NOTIFICATION_ID,
                            buildWaitingNotification("대기중", lastAlertSummary)
                    );
                });
            } catch (Exception error) {
                Log.e(TAG, "poll failed", error);
                handler.post(() -> {
                    NotificationManager manager =
                            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                    manager.notify(
                            WAITING_NOTIFICATION_ID,
                            buildWaitingNotification("확인 실패", error.getMessage())
                    );
                });
            } finally {
                pollInFlight = false;
            }
        });
    }

    private JSONArray fetchAlerts() throws Exception {
        URL url = new URL(getBaseUrl() + "/api/admin-alarm/youtube-reservations");
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(10000);
        connection.setRequestProperty("x-admin-alarm-pin", getPin());

        int status = connection.getResponseCode();
        String body = readBody(status >= 400 ? connection.getErrorStream() : connection.getInputStream());
        if (status < 200 || status >= 300) {
            throw new IllegalStateException("서버 응답 오류: " + status + " " + body);
        }
        JSONObject json = new JSONObject(body);
        return json.optJSONArray("alerts") != null ? json.getJSONArray("alerts") : new JSONArray();
    }

    private void acknowledgeActiveAlerts() {
        Set<String> ids = new HashSet<>(activeAlertIds);
        activeAlertIds.clear();
        executor.execute(() -> {
            for (String id : ids) {
                try {
                    acknowledgeAlert(id);
                } catch (Exception error) {
                    Log.e(TAG, "ack failed: " + id, error);
                }
            }
            handler.post(() -> {
                NotificationManager manager =
                        (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                manager.cancel(ALERT_NOTIFICATION_ID);
                lastAlertSummary = "확인 처리 완료";
                manager.notify(
                        WAITING_NOTIFICATION_ID,
                        buildWaitingNotification("대기중", lastAlertSummary)
                );
            });
        });
    }

    private void acknowledgeAlert(String id) throws Exception {
        URL url = new URL(getBaseUrl() + "/api/admin-alarm/youtube-reservations/" + id + "/ack");
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(10000);
        connection.setDoOutput(true);
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setRequestProperty("x-admin-alarm-pin", getPin());
        byte[] payload = "{\"acknowledged_by\":\"android_alarm_app\"}".getBytes(StandardCharsets.UTF_8);
        try (OutputStream output = connection.getOutputStream()) {
            output.write(payload);
        }

        int status = connection.getResponseCode();
        if (status < 200 || status >= 300) {
            String body = readBody(connection.getErrorStream());
            throw new IllegalStateException("ack failed: " + status + " " + body);
        }
    }

    private void startAlarm(String title, String message) {
        startAlarmSound();
        startVibration();
        NotificationManager manager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        manager.notify(ALERT_NOTIFICATION_ID, buildAlertNotification(title, message));
    }

    private void startAlarmSound() {
        if (mediaPlayer != null && mediaPlayer.isPlaying()) return;
        stopAlarmSound();
        try {
            Uri alarmUri = Settings.System.DEFAULT_ALARM_ALERT_URI;
            if (alarmUri == null) {
                alarmUri = Settings.System.DEFAULT_NOTIFICATION_URI;
            }
            mediaPlayer = new MediaPlayer();
            if (Build.VERSION.SDK_INT >= 21) {
                mediaPlayer.setAudioAttributes(
                        new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build()
                );
            }
            mediaPlayer.setDataSource(this, alarmUri);
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception error) {
            Log.e(TAG, "alarm sound failed", error);
        }
    }

    private void stopAlarmSound() {
        if (mediaPlayer != null) {
            try {
                mediaPlayer.stop();
            } catch (Exception ignored) {
            }
            mediaPlayer.release();
            mediaPlayer = null;
        }
        if (vibrator != null) {
            vibrator.cancel();
        }
    }

    private void startVibration() {
        if (vibrator == null || !vibrator.hasVibrator()) return;
        long[] pattern = new long[]{0, 600, 250, 600, 800};
        if (Build.VERSION.SDK_INT >= 26) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
        } else {
            vibrator.vibrate(pattern, 0);
        }
    }

    private Notification buildWaitingNotification(String title, String message) {
        PendingIntent openIntent = PendingIntent.getActivity(
                this,
                1,
                new Intent(this, MainActivity.class),
                pendingIntentFlags()
        );
        return new Notification.Builder(this, WAITING_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("Brify 알림 " + title)
                .setContentText(message == null ? "" : message)
                .setContentIntent(openIntent)
                .setOngoing(true)
                .build();
    }

    private Notification buildAlertNotification(String title, String message) {
        PendingIntent openAdminIntent = PendingIntent.getActivity(
                this,
                2,
                new Intent(Intent.ACTION_VIEW, Uri.parse(getBaseUrl() + "/ko/admin/youtube-reservations")),
                pendingIntentFlags()
        );
        PendingIntent stopSoundIntent = PendingIntent.getService(
                this,
                3,
                new Intent(this, AlarmPollingService.class).setAction(ACTION_STOP_SOUND),
                pendingIntentFlags()
        );
        PendingIntent ackIntent = PendingIntent.getService(
                this,
                4,
                new Intent(this, AlarmPollingService.class).setAction(ACTION_ACK_ALL),
                pendingIntentFlags()
        );

        return new Notification.Builder(this, ALERT_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(new Notification.BigTextStyle().bigText(message))
                .setPriority(Notification.PRIORITY_MAX)
                .setCategory(Notification.CATEGORY_ALARM)
                .setContentIntent(openAdminIntent)
                .addAction(android.R.drawable.ic_lock_silent_mode, "소리만 멈춤", stopSoundIntent)
                .addAction(android.R.drawable.checkbox_on_background, "확인 처리", ackIntent)
                .setAutoCancel(false)
                .build();
    }

    private int pendingIntentFlags() {
        return Build.VERSION.SDK_INT >= 23
                ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
                : PendingIntent.FLAG_UPDATE_CURRENT;
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager manager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        NotificationChannel waitingChannel = new NotificationChannel(
                WAITING_CHANNEL_ID,
                "Brify 대기 상태",
                NotificationManager.IMPORTANCE_LOW
        );
        waitingChannel.setDescription("Brify 유튜브 예약 요청을 기다리는 상시 알림입니다.");
        manager.createNotificationChannel(waitingChannel);

        NotificationChannel alertChannel = new NotificationChannel(
                ALERT_CHANNEL_ID,
                "Brify 긴급 알림",
                NotificationManager.IMPORTANCE_HIGH
        );
        alertChannel.setDescription("새 유튜브 예약 요청이 들어왔을 때 표시되는 긴급 알림입니다.");
        alertChannel.enableVibration(true);
        manager.createNotificationChannel(alertChannel);
    }

    private long getPollingIntervalMs() {
        return Math.max(5000, getPrefs().getInt(MainActivity.KEY_INTERVAL_SECONDS, 10) * 1000L);
    }

    private String getBaseUrl() {
        String baseUrl = getPrefs().getString(MainActivity.KEY_BASE_URL, "https://www.brify.app");
        if (baseUrl == null || baseUrl.trim().isEmpty()) return "https://www.brify.app";
        baseUrl = baseUrl.trim();
        if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        return baseUrl;
    }

    private String getPin() {
        String pin = getPrefs().getString(MainActivity.KEY_PIN, "");
        return pin == null ? "" : pin.trim();
    }

    private SharedPreferences getPrefs() {
        return getSharedPreferences(MainActivity.PREFS, Context.MODE_PRIVATE);
    }

    private String readBody(InputStream inputStream) throws Exception {
        if (inputStream == null) return "";
        StringBuilder builder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                builder.append(line);
            }
        }
        return builder.toString();
    }
}
