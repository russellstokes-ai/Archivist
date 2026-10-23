package app.archivist.reader;

public final class MetadataRecoveryPolicyTest {
    public static void main(String[] args) {
        String original = "a".repeat(64), updated = "b".repeat(64), external = "c".repeat(64);
        expect(original, original, updated, MetadataRecoveryPolicy.Action.KEEP_ORIGINAL);
        expect(updated, original, updated, MetadataRecoveryPolicy.Action.KEEP_UPDATED);
        expect(external, original, updated, MetadataRecoveryPolicy.Action.REQUIRE_REVIEW);
        // A truncated replacement and an external edit are both unrecognised.
        // Neither authorises overwriting the current document on app restart.
        expect("d".repeat(64), original, updated, MetadataRecoveryPolicy.Action.REQUIRE_REVIEW);
        try {
            MetadataRecoveryPolicy.decide("", original, updated);
            throw new AssertionError("Invalid fingerprint accepted");
        } catch (IllegalArgumentException expected) { }
        System.out.println("PASS: original, updated, interrupted and externally changed recovery decisions");
    }
    private static void expect(String current, String original, String updated, MetadataRecoveryPolicy.Action action) {
        if (MetadataRecoveryPolicy.decide(current, original, updated) != action) throw new AssertionError(action);
    }
}
