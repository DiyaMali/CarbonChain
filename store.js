/**
 * CarbonChain Shared State Store
 * Manages wallet state, project supply, pricing calculations,
 * and persistent transaction history across multi-page HTML screens.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'carbonchain_store_v1';

  const DEFAULT_STATE = {
    wallet: {
      connected: true,
      address: '0x71C49615598d1aA24A6A810619a896d8CeaF8338',
      shortAddress: '0x71...338',
      network: 'Polygon Mainnet'
    },
    project: {
      id: 'solar-energy-01',
      name: 'Solar Energy Project',
      owner: 'Tata Industries',
      location: 'Maharashtra, India',
      type: 'Solar Energy',
      verification: 'Verra',
      unitPrice: 1200,
      platformFeeRate: 0.02, // 2%
      initialSupply: 1000,
      remainingSupply: 1000,
      tokenId: '#1042',
      created: '12 Sept 2026',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMjCVwWYTnfVPxoGy6qjxdwrwd_kOmSh2SYaFzQ0MT8B1FzNGbjUuYIFw60BxSrOARCO5rA9Qwfrmbrv300nu1O73UiZIaJUo-Lww79mcpqVBwGlDCYuNYXrEyivH-bdKicbJbawYZ5V3GNTwpDvT7Mgu9UWX0MalLyCHPKI8_unXadseB4T7rcjvseg-dX2yNXZskXRve5Crppqw6-ddwF4pbwYTBj-ZLqo7B3Zgkix6EopJ-_bbm'
    },
    transactions: [
      {
        id: 'tx_init_1',
        date: '28 Sep 2026, 04:15 PM',
        project: 'Solar Energy Project',
        quantity: 5,
        subtotal: 6000,
        fee: 120,
        amountPaid: 6120,
        status: 'Confirmed',
        txHash: '0x4f8e72b19280ad7301c2394c8e7094d21e859ab3',
        shortTxHash: '0x4f8e...9ab3',
        tokenId: '#1040',
        isNew: false
      },
      {
        id: 'tx_init_2',
        date: '15 Sep 2026, 11:30 AM',
        project: 'Wind Energy Project',
        quantity: 10,
        subtotal: 12000,
        fee: 240,
        amountPaid: 12240,
        status: 'Confirmed',
        txHash: '0x81b7a59918efbc01284a6c8e3100234a92c39d41',
        shortTxHash: '0x81b7...9d41',
        tokenId: '#1038',
        isNew: false
      }
    ],
    lastPurchase: null,
    simulateError: false
  };

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          wallet: { ...DEFAULT_STATE.wallet, ...(parsed.wallet || {}) },
          project: { ...DEFAULT_STATE.project, ...(parsed.project || {}) },
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : DEFAULT_STATE.transactions
        };
      }
    } catch (e) {
      console.warn('Failed to load CarbonChain store from localStorage', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save CarbonChain store to localStorage', e);
    }
  }

  function formatINR(number) {
    if (typeof number !== 'number' || isNaN(number)) return '₹0';
    return '₹' + Math.round(number).toLocaleString('en-IN');
  }

  function formatNumber(number) {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    return number.toLocaleString('en-IN');
  }

  function generateRandomTxHash() {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 40; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  }

  function shortenHash(hash) {
    if (!hash || hash.length < 10) return hash || '';
    return hash.slice(0, 6) + '...' + hash.slice(-4);
  }

  function formatTimestamp(d = new Date()) {
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day} ${month} ${year}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  }

  const Store = {
    getState() {
      return loadState();
    },

    setWalletConnected(connected) {
      const state = loadState();
      state.wallet.connected = !!connected;
      saveState(state);
      return state;
    },

    toggleWallet() {
      const state = loadState();
      state.wallet.connected = !state.wallet.connected;
      saveState(state);
      return state;
    },

    setSimulateError(simulate) {
      const state = loadState();
      state.simulateError = !!simulate;
      saveState(state);
      return state;
    },

    calculatePricing(quantity) {
      const state = loadState();
      const unitPrice = state.project.unitPrice;
      const feeRate = state.project.platformFeeRate;
      const qty = parseInt(quantity, 10) || 0;

      const subtotal = qty * unitPrice;
      const platformFee = Math.round(subtotal * feeRate);
      const total = subtotal + platformFee;

      return {
        quantity: qty,
        unitPrice,
        subtotal,
        platformFee,
        total,
        feeRatePercent: Math.round(feeRate * 100)
      };
    },

    calculateFromBudget(budgetAmount) {
      const state = loadState();
      const unitPrice = state.project.unitPrice;
      const feeRate = state.project.platformFeeRate;
      const budget = parseFloat(budgetAmount) || 0;

      // Price per 1 credit including fee: 1200 * 1.02 = 1224
      const singleCreditTotal = Math.round(unitPrice * (1 + feeRate));

      if (budget < singleCreditTotal) {
        return {
          quantity: 0,
          budget,
          unitPrice,
          subtotal: 0,
          platformFee: 0,
          total: 0,
          unused: budget,
          singleCreditTotal,
          error: `Minimum purchase is ${formatINR(singleCreditTotal)} (1 credit plus 2% fee)`
        };
      }

      const quantity = Math.floor(budget / singleCreditTotal);
      const subtotal = quantity * unitPrice;
      const platformFee = Math.round(subtotal * feeRate);
      const total = subtotal + platformFee;
      const unused = Math.max(0, budget - total);

      return {
        quantity,
        budget,
        unitPrice,
        subtotal,
        platformFee,
        total,
        unused,
        singleCreditTotal,
        error: null
      };
    },

    recordPurchase(quantity, customAmount) {
      const state = loadState();
      const qty = parseInt(quantity, 10);

      if (!qty || qty < 1) {
        throw new Error('Quantity must be at least 1 credit');
      }

      if (qty > state.project.remainingSupply) {
        throw new Error(`Only ${state.project.remainingSupply} credits available`);
      }

      if (state.simulateError) {
        throw new Error('Simulation network error: Unable to confirm on Polygon');
      }

      const pricing = this.calculatePricing(qty);
      const txHash = generateRandomTxHash();
      const shortTxHash = shortenHash(txHash);
      const newTokenNum = 1042 + state.transactions.length + 1;
      const tokenId = '#' + newTokenNum;
      const timestamp = formatTimestamp();

      const newTx = {
        id: 'tx_' + Date.now(),
        date: timestamp,
        project: state.project.name,
        quantity: qty,
        subtotal: pricing.subtotal,
        fee: pricing.platformFee,
        amountPaid: pricing.total,
        status: 'Confirmed',
        txHash: txHash,
        shortTxHash: shortTxHash,
        tokenId: tokenId,
        isNew: true
      };

      // Mark older transactions as not new
      state.transactions.forEach(t => { t.isNew = false; });

      // Add new transaction to top
      state.transactions.unshift(newTx);

      // Decrement remaining supply
      state.project.remainingSupply = Math.max(0, state.project.remainingSupply - qty);
      state.lastPurchase = newTx;

      saveState(state);
      return newTx;
    },

    markTransactionsViewed() {
      const state = loadState();
      let changed = false;
      state.transactions.forEach(t => {
        if (t.isNew) {
          t.isNew = false;
          changed = true;
        }
      });
      if (changed) {
        saveState(state);
      }
    },

    resetToDefaults() {
      saveState(DEFAULT_STATE);
      return loadState();
    },

    formatINR,
    formatNumber,
    shortenHash
  };

  window.CarbonChainStore = Store;
})(window);
