package in.nizhal.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

/**
 * NIZHAL guard service.
 *
 * Android kills or freezes a backgrounded WebView within seconds. A foreground
 * service with a persistent notification is the ONLY sanctioned way to keep
 * sensing alive, and the PARTIAL_WAKE_LOCK is what keeps the CPU delivering
 * accelerometer callbacks after the screen turns off.
 *
 * The notification is required by the OS and we treat that as a feature:
 * the user can always see that NIZHAL is running. There is no silent mode.
 */
public class GuardService extends Service {

    public static final String CHANNEL_ID = "nizhal_guard";
    public static final int NOTIF_ID = 4201;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();

        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "nizhal:guard");
        wakeLock.setReferenceCounted(false);
        wakeLock.acquire();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent pi = PendingIntent.getActivity(
                this, 0, open,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification n = new Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("NIZHAL is guarding")
                .setContentText("Motion and audio sensing active. Tap to open.")
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .setContentIntent(pi)
                .setOngoing(true)
                .build();

        startForeground(NOTIF_ID, n);
        return START_STICKY;   // restart us if the system reclaims memory
    }

    @Override
    public void onDestroy() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel c = new NotificationChannel(
                    CHANNEL_ID, "NIZHAL guarding", NotificationManager.IMPORTANCE_LOW);
            c.setDescription("Shown whenever NIZHAL is sensing. It is never hidden.");
            c.setShowBadge(false);
            ((NotificationManager) getSystemService(NotificationManager.class)).createNotificationChannel(c);
        }
    }

    public static void start(Context ctx) {
        Intent i = new Intent(ctx, GuardService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(i);
        else ctx.startService(i);
    }
    public static void stop(Context ctx) {
        ctx.stopService(new Intent(ctx, GuardService.class));
    }
}
