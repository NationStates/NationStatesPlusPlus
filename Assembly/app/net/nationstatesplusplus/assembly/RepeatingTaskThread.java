package net.nationstatesplusplus.assembly;

import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import org.joda.time.Duration;

import play.Logger;

public class RepeatingTaskThread extends Thread {
	private static final List<RepeatingTaskThread> threads = new LinkedList<RepeatingTaskThread>();
	private final Runnable task;
	private final Duration initialDelay;
	private final Duration repeatingDelay;
	private final AtomicBoolean shutdown = new AtomicBoolean(false);
	public RepeatingTaskThread(Duration initialDelay, Duration repeatingDelay, Runnable task) {
		super("Repeating Task Thread - [" + task.getClass().getSimpleName() + "]");
		this.initialDelay = initialDelay;
		this.repeatingDelay = repeatingDelay;
		this.task = task;
		setDaemon(true);
		synchronized(threads) {
			threads.add(this);
		}
	}

	@Override
	public void run() {
		try {
			Thread.sleep(initialDelay.getMillis());
		} catch (InterruptedException e) { }
		while(!shutdown.get()) {
			try {
				task.run();
			} catch (Exception e) {
				Logger.error("Unhandled exception running task [" + task.getClass().getSimpleName() + "]", e);
			}
			if (!shutdown.get()) {
				if (repeatingDelay == null) {
					synchronized(threads) {
						threads.remove(this);
					}
					return;
				}
				try {
					Thread.sleep(repeatingDelay.getMillis());
				} catch (InterruptedException e) { }
			}
		}
	}

	public static void stopAll() {
		synchronized(threads) {
			for (RepeatingTaskThread thread : threads) {
				thread.shutdown.set(true);
				thread.interrupt();
			}
			for (RepeatingTaskThread thread : threads) {
				try {
					thread.join(5000L);
				} catch (InterruptedException e) {
					Logger.warn("Unable to stop thread [" + thread.getName() + "]");
				}
			}
			threads.clear();
		}
	}
}
