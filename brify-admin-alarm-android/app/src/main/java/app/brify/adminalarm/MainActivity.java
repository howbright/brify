package app.brify.adminalarm;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    static final String PREFS = "brify_admin_alarm";
    static final String KEY_BASE_URL = "base_url";
    static final String KEY_PIN = "pin";
    static final String KEY_INTERVAL_SECONDS = "interval_seconds";

    private EditText baseUrlInput;
    private EditText pinInput;
    private EditText intervalInput;
    private TextView statusText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestNotificationPermissionIfNeeded();

        SharedPreferences prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        ScrollView scrollView = new ScrollView(this);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20), dp(24), dp(20), dp(24));
        scrollView.addView(root);

        TextView title = new TextView(this);
        title.setText("Brify 관리자 알람");
        title.setTextSize(24);
        title.setGravity(Gravity.START);
        title.setTypeface(null, 1);
        root.addView(title, matchWrap());

        TextView description = new TextView(this);
        description.setText("유튜브 구조맵 예약 요청을 주기적으로 확인하고, 새 요청이 있으면 알람음을 반복 재생합니다.");
        description.setTextSize(15);
        description.setPadding(0, dp(10), 0, dp(18));
        root.addView(description, matchWrap());

        baseUrlInput = new EditText(this);
        baseUrlInput.setHint("서버 주소");
        baseUrlInput.setSingleLine(true);
        baseUrlInput.setText(prefs.getString(KEY_BASE_URL, "https://www.brify.app"));
        root.addView(label("서버 주소"));
        root.addView(baseUrlInput, matchWrap());

        pinInput = new EditText(this);
        pinInput.setHint("관리자 알람 PIN");
        pinInput.setSingleLine(true);
        pinInput.setText(prefs.getString(KEY_PIN, ""));
        root.addView(label("관리자 알람 PIN"));
        root.addView(pinInput, matchWrap());

        intervalInput = new EditText(this);
        intervalInput.setHint("폴링 간격(초)");
        intervalInput.setSingleLine(true);
        intervalInput.setText(String.valueOf(prefs.getInt(KEY_INTERVAL_SECONDS, 10)));
        root.addView(label("폴링 간격"));
        root.addView(intervalInput, matchWrap());

        Button saveButton = new Button(this);
        saveButton.setText("설정 저장");
        saveButton.setOnClickListener(v -> {
            saveSettings();
            Toast.makeText(this, "저장했습니다.", Toast.LENGTH_SHORT).show();
        });
        root.addView(saveButton, matchWrap());

        Button startButton = new Button(this);
        startButton.setText("알람 대기 시작");
        startButton.setOnClickListener(v -> {
            saveSettings();
            startBrifyService(AlarmPollingService.ACTION_START);
            statusText.setText("상태: 대기중");
        });
        root.addView(startButton, matchWrap());

        Button stopSoundButton = new Button(this);
        stopSoundButton.setText("알람 소리만 멈춤");
        stopSoundButton.setOnClickListener(v -> startService(
                new Intent(this, AlarmPollingService.class)
                        .setAction(AlarmPollingService.ACTION_STOP_SOUND)
        ));
        root.addView(stopSoundButton, matchWrap());

        Button stopButton = new Button(this);
        stopButton.setText("알람 대기 완전 중지");
        stopButton.setOnClickListener(v -> {
            startService(
                    new Intent(this, AlarmPollingService.class)
                            .setAction(AlarmPollingService.ACTION_STOP_SERVICE)
            );
            statusText.setText("상태: 중지됨");
        });
        root.addView(stopButton, matchWrap());

        Button testButton = new Button(this);
        testButton.setText("알람 테스트");
        testButton.setOnClickListener(v -> {
            saveSettings();
            startBrifyService(AlarmPollingService.ACTION_TEST_ALARM);
        });
        root.addView(testButton, matchWrap());

        Button openAdminButton = new Button(this);
        openAdminButton.setText("관리자 예약 페이지 열기");
        openAdminButton.setOnClickListener(v -> openAdminPage());
        root.addView(openAdminButton, matchWrap());

        Button batteryButton = new Button(this);
        batteryButton.setText("배터리 최적화 설정 열기");
        batteryButton.setOnClickListener(v -> {
            Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
            startActivity(intent);
        });
        root.addView(batteryButton, matchWrap());

        statusText = new TextView(this);
        statusText.setText("상태: 준비됨");
        statusText.setTextSize(16);
        statusText.setPadding(0, dp(20), 0, 0);
        root.addView(statusText, matchWrap());

        setContentView(scrollView);
    }

    private void saveSettings() {
        int intervalSeconds = 10;
        try {
            intervalSeconds = Math.max(5, Integer.parseInt(intervalInput.getText().toString().trim()));
        } catch (Exception ignored) {
        }
        getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_BASE_URL, baseUrlInput.getText().toString().trim())
                .putString(KEY_PIN, pinInput.getText().toString().trim())
                .putInt(KEY_INTERVAL_SECONDS, intervalSeconds)
                .apply();
    }

    private void openAdminPage() {
        String baseUrl = baseUrlInput.getText().toString().trim();
        if (baseUrl.endsWith("/")) baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(baseUrl + "/ko/admin/youtube-reservations")));
    }

    private TextView label(String text) {
        TextView label = new TextView(this);
        label.setText(text);
        label.setTextSize(13);
        label.setPadding(0, dp(12), 0, dp(4));
        return label;
    }

    private LinearLayout.LayoutParams matchWrap() {
        return new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33 &&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 100);
        }
    }

    private void startBrifyService(String action) {
        Intent intent = new Intent(this, AlarmPollingService.class).setAction(action);
        if (Build.VERSION.SDK_INT >= 26) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }
    }
}
