# Brify Admin Alarm Android

Brify 관리자 전용 알람폰 앱입니다. Firebase/FCM 없이 Brify 서버를 주기적으로 확인하고, 새 YouTube 구조맵 예약 요청이 있으면 기본 알람음을 반복 재생합니다.

## Server Setup

Supabase SQL:

```sql
-- Run this migration in Supabase:
-- supabase/migrations/20260824_add_youtube_reservation_admin_alarm_ack.sql
```

Next.js/Vercel environment:

```env
BRIFY_ADMIN_ALARM_PIN=<long-random-pin>
```

The Android app sends this value in the `x-admin-alarm-pin` header.

## API

Poll new alerts:

```http
GET https://www.brify.app/api/admin-alarm/youtube-reservations
x-admin-alarm-pin: <pin>
```

Acknowledge an alert:

```http
POST https://www.brify.app/api/admin-alarm/youtube-reservations/{reservationId}/ack
x-admin-alarm-pin: <pin>
Content-Type: application/json

{"acknowledged_by":"android_alarm_app"}
```

## Android Usage

1. Open this folder in Android Studio.
2. Install the app on the alarm phone.
3. Open the app and enter:
   - Server URL: `https://www.brify.app`
   - Admin alarm PIN: the same value as `BRIFY_ADMIN_ALARM_PIN`
   - Polling interval: `10`
4. Tap `알람 대기 시작`.
5. Allow notification permission.
6. Disable battery optimization for this app.

The app shows a persistent Android notification while waiting. It does not cover the screen; it only keeps the foreground service alive.

## Behavior

- Waiting: polls the server every configured interval.
- New YouTube reservation: plays the default alarm sound in a loop and vibrates.
- `알람 소리만 멈춤`: stops sound/vibration but keeps the request visible.
- `확인 처리`: marks the reservation as acknowledged so it does not alert again.
- `관리자 예약 페이지 열기`: opens `/ko/admin/youtube-reservations`.
