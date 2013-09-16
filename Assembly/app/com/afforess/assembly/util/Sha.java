package com.afforess.assembly.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class Sha {
	public static String hash256(String data) {
		try {MessageDigest md = MessageDigest.getInstance("SHA-256");
			md.update(data.getBytes());
			return bytesToHex(md.digest());
		} catch (NoSuchAlgorithmException e) {
			throw new RuntimeException(e);
		}
	}

	public static String bytesToHex(byte[] bytes) {
		StringBuffer result = new StringBuffer();
		for (byte byt : bytes) result.append(Integer.toString((byt & 0xff) + 0x100, 16).substring(1));
		return result.toString();
	}
}