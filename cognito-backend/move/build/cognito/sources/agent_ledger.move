module cognito::agent_ledger {
    use sui::event;
    use std::string::String;

    public struct SessionAnchored has copy, drop {
        session_id: String,
        agent_id: String,
        agent_name: String,
        action_count: u64,
        blob_id: String,
        suisql_object_id: address,
        timestamp: u64,
    }

    public fun anchor_session(
        session_id: String,
        agent_id: String,
        agent_name: String,
        action_count: u64,
        blob_id: String,
        suisql_object_id: address,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        event::emit(SessionAnchored {
            session_id,
            agent_id,
            agent_name,
            action_count,
            blob_id,
            suisql_object_id,
            timestamp: sui::tx_context::epoch_timestamp_ms(ctx),
        });
    }
}
