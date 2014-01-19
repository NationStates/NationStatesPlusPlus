package com.afforess.assembly.model;

public enum RecruitmentResult {
	SUCCESS(0, ""),
	INVALID_TELEGRAM(1, "Error sending recruitment telegrams. Check client key, telegram id, secret key, and try again!"),
	RATE_LIMITED(2, "Error sending recruitment telegrams. Your Client Key has been rate limited. Ensure no other programs or scripts are using this client key. Wait 15 minutes."),
	DISABLED_BY_MODERATORS(3, "Your API Client Key has been disabled by the NationStates Moderators. File a <a href=\"http://www.nationstates.net/page=help\">Getting Help Request</a> for more details."),
	NO_SUCH_TELEGRAM_TEMPLATE(4, "Your recruitment telegram does not exist. Check your telegram id and secret key."),
	INCORRECT_SECRET_KEY(5, "Incorrect secret key. Check your telegram secret key.");
	private final int id;
	private final String errorMessage;
	RecruitmentResult(int id, String errorMessage) {
		this.id = id;
		this.errorMessage = errorMessage;
	}

	public int getId() {
		return id;
	}

	public String getErrorMessage() {
		return errorMessage;
	}

	public static RecruitmentResult getById(int id) {
		for (RecruitmentResult r : values()) {
			if (r.getId() == id) {
				return r;
			}
		}
		return null;
	}
}