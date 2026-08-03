// model.js — NRF2 GBM Model (200 decision trees)
// Auto-generated from scikit-learn GradientBoostingRegressor
// Dataset: Cutaneous Leishmaniasis, n=232
// R²=0.970 | AUC=1.000 | CV R²=0.958±0.036

window.NRF2_GBM = (function() {

  // ── Predict single tree by walking nodes ──────────────────────────────────
  function predictTree(node, x) {
    while ('f' in node) {
      node = x[node.f] <= node.t ? node.l : node.r;
    }
    return node.v;
  }

  // ── Main prediction function ───────────────────────────────────────────────
  // Input: object with keys GSH, SOD, Catalase, MPO, NO, Arginase (raw values)
  // Output: NRF2 score 0–100
  function predict(vals) {
    if (!MODEL) { console.warn('[NRF2] Model not loaded yet'); return null; }

    // 1. Standardize (StandardScaler)
    const x = MODEL.features.map((f, i) =>
      (vals[f] - MODEL.scaler_mean[i]) / MODEL.scaler_std[i]
    );

    // 2. Sum tree predictions (gradient boosting)
    let pred = MODEL.init_pred;
    for (const tree of MODEL.trees) {
      pred += MODEL.learning_rate * predictTree(tree, x);
    }

    // 3. Clip to [0, 100]
    return Math.min(100, Math.max(0, pred));
  }

  // ── Load model JSON asynchronously ────────────────────────────────────────
  let MODEL = null;
  let loadPromise = null;

  function load(url) {
    url = url || 'gbm_model.json';
    if (loadPromise) return loadPromise;
    loadPromise = fetch(url)
      .then(r => r.json())
      .then(data => {
        MODEL = data;
        console.log('[NRF2] GBM model loaded —', MODEL.trees.length, 'trees');
        document.dispatchEvent(new Event('nrf2-model-ready'));
      })
      .catch(err => {
        console.error('[NRF2] Failed to load model:', err);
      });
    return loadPromise;
  }

  function isReady() { return MODEL !== null; }

  return { load, predict, isReady };
})();
