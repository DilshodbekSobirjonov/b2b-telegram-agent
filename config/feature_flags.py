FEATURES = {
    "booking": True,
    "crm": True,
    "faq": True
}

def is_feature_enabled(feature_name: str) -> bool:
    return FEATURES.get(feature_name, False)
