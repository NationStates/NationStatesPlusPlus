package com.afforess.assembly.model;

public enum RecruitmentType {
	NEW_NATIONS(0),
	REFOUNDED_NATIONS(1),
	EJECTED_NATIONS(2);

	final int id;
	RecruitmentType(int id) {
		this.id = id;
	}

	public int getId() {
		return id;
	}

	public static RecruitmentType getById(int id) {
		for (RecruitmentType t : values()) {
			if (t.id == id) {
				return t;
			}
		}
		return null;
	}
}
