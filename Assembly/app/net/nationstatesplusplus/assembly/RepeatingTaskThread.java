package net.nationstatesplusplus.assembly;

import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import org.joda.time.Duration;

import play.Logger;

public class RepeatingTaskThread extends Thread {
	private static final List<RepeatingTaskThread> threads = new LinkedList<RepeatingTaskThread>();
	private static final AtomicInteger createdCount = new AtomicInteger(0);
	private final Runnable task;
	private final Duration initialDelay;
	private final Duration repeatingDelay;
	private final AtomicBoolean shutdown = new AtomicBoolean(false);
	private final ExecutorService service;
	private final String serviceName;
	public RepeatingTaskThread(Duration initialDelay, Duration repeatingDelay, Runnable task) {
		super("Repeating Task Thread - [" + task.getClass().getSimpleName() + "]");
		this.serviceName = task.getClass().getSimpleName() + "-" + createdCount.incrementAndGet();
		this.service = Executors.newFixedThreadPool(1, new NamedThreadFactory(serviceName));
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
			runInterruptable();
		} catch (Exception e) {
			Logger.error("Interrupted in handling repeated task - [" + task.getClass().getSimpleName() + "]", e);
		}
		Logger.info("Execution of all tasks of [" + task.getClass().getSimpleName() + "] has completed. Repeating Task Thread shutting down.");
		service.shutdownNow();
	}

	private static boolean isFutureCompleted(final Future<Boolean> task, final Duration duration) {
		try {
			final Boolean result = task.get(duration.getMillis(), TimeUnit.MILLISECONDS);
			//Only a boolean "true" result signifies successful completion
			if (result != null && result.booleanValue() == true) {
				return true;
			}
			return false;
		} catch (TimeoutException timeout) {
			return false; //execution is not completed yet
		} catch (InterruptedException e) {
			return true; // interrupted, but is finished
		} catch (ExecutionException e) {
			return true; //execution failed, but is finished
		}
	}

	private Future<Boolean> submitTask(final Runnable runnable) {
		return service.submit(new Runnable() {
			@Override
			public void run() {
				try {
					runnable.run();
				} catch (Exception e) {
					Logger.error("Unhandled exception running task [" + runnable.getClass().getSimpleName() + "]", e);
				}
			}
		}, true);
	}

	public void runInterruptable() throws InterruptedException {
		Thread.sleep(initialDelay.getMillis());
		while(!shutdown.get()) {
			Future<Boolean> future = submitTask(task);
			if (repeatingDelay != null) {
				final long start = System.currentTimeMillis();
				
				boolean executionFinished = false;
				for (int attempts = 0; attempts <= 5; attempts++) {
					if (isFutureCompleted(future, repeatingDelay)) {
						executionFinished = true;
						break;
					}
				}
				if (!executionFinished) {
					Logger.error("Execution of running task [" + task.getClass().getSimpleName() + "] has exceeded 5x max its duration, the task will be interrupted forcefully!");
					Thread[] thread = new Thread[Thread.activeCount()];
					Thread.enumerate(thread);
					for (int i = 0; i < thread.length; i++) {
						if (thread[i] != null && thread[i].getName().equals(serviceName)) {
							Logger.error("Debugging stalled thread: " + thread[i].getName());
							Logger.error("    PID: " + thread[i].getId() + " | Alive: " + thread[i].isAlive() + " | State: " + thread[i].getState());
							Logger.error("    Stack:");
							StackTraceElement[] stack = thread[i].getStackTrace();
							for (int line = 0; line < stack.length; line++) {
								Logger.error("        " + stack[line].toString());
							}
						}
					}
					future.cancel(true);
				}
				
				//If the task completed fast than the delay
				final long executionTime = System.currentTimeMillis() - start;
				if (executionTime < repeatingDelay.getMillis()) {
					Thread.sleep(repeatingDelay.getMillis() - executionTime);
				}
			} else {
				synchronized(threads) {
					threads.remove(this);
				}
				service.shutdown();
				shutdown.set(true);
				//Attempt to kill any threads that take excessive time
				if (!service.awaitTermination(1, TimeUnit.HOURS)) {
					service.shutdownNow();
				}
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

	private static class NamedThreadFactory implements ThreadFactory {
		private final String name;
		public NamedThreadFactory(String name) {
			this.name = name;
		}

		@Override
		public Thread newThread(Runnable r) {
			Thread thread = new Thread(r, name);
			return thread;
		}
	}
}
