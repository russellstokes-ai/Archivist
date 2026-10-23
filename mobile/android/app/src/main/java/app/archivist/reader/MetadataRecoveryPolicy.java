package app.archivist.reader;

/** Recovery must never guess whether unfamiliar bytes are an external edit. */
final class MetadataRecoveryPolicy {
    enum Action { KEEP_UPDATED, KEEP_ORIGINAL, REQUIRE_REVIEW }

    static Action decide(String current, String original, String updated) {
        if (!valid(current) || !valid(original) || !valid(updated)) {
            throw new IllegalArgumentException("Verified SHA-256 fingerprints are required");
        }
        if (current.equals(updated)) return Action.KEEP_UPDATED;
        if (current.equals(original)) return Action.KEEP_ORIGINAL;
        return Action.REQUIRE_REVIEW;
    }

    private static boolean valid(String value) {
        return value != null && value.matches("[a-f0-9]{64}");
    }
}
