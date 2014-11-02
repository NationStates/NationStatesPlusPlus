package net.nationstatesplusplus.assembly.logging;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import org.slf4j.Logger;

import ch.qos.logback.classic.Level;

public class LoggerOutputStream extends ByteArrayOutputStream {
	private final String separator = System.getProperty("line.separator");
	private final Level level;
	private final Logger log;

	public LoggerOutputStream(Level level, Logger log) {
		this.level = level;
		this.log = log;
	}

	@Override
	public synchronized void flush() throws IOException {
		super.flush();
		String record = this.toString();
		super.reset();

		if (record.length() > 0 && !record.equals(separator) && level != Level.OFF) {
			if (level == Level.TRACE)
				log.trace(record);
			else if (level == Level.DEBUG)
				log.debug(record);
			else if (level == Level.INFO)
				log.info(record);
			else if (level == Level.WARN)
				log.warn(record);
			else if (level == Level.ERROR)
				log.error(record);
		}
	}
}
