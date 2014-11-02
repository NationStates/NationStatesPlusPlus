package net.nationstatesplusplus.assembly.logging;

import play.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.ThrowableProxy;
import ch.qos.logback.core.filter.Filter;
import ch.qos.logback.core.spi.FilterReply;

public class LoggingFilter extends Filter<ILoggingEvent> {
	
	public LoggingFilter() {
		Logger.warn("Creating logging filter!");
	}

	@Override
	public FilterReply decide(ILoggingEvent event) {
		final IThrowableProxy throwableProxy = event.getThrowableProxy();
		if (throwableProxy == null) {
			return FilterReply.NEUTRAL;
		}

		if (!(throwableProxy instanceof ThrowableProxy)) {
			return FilterReply.NEUTRAL;
		}

		final ThrowableProxy throwableProxyImpl = (ThrowableProxy) throwableProxy;
		final Throwable throwable = throwableProxyImpl.getThrowable();
		if (java.nio.channels.ClosedChannelException.class.isInstance(throwable)) {
			return FilterReply.DENY;
		}

		return FilterReply.NEUTRAL;
	}
}
