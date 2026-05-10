export function createInitialState() {
  return {
    history: null,
    parseResult: { records: [], errors: [] },
    duplicate: null,
    duplicateDecision: null,
    generated: null,
    status: 'editing'
  };
}

export function applyDuplicateDecision(state, decision) {
  return {
    ...state,
    duplicateDecision: decision,
    status: decision ? 'ready' : state.status
  };
}
