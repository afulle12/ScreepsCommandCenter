global.rawMarketData = function(resourceFilter, includeAnalysis) {
  // Collect ALL resources
  var allResources = {};

  // Lab commodities
  for (var r in REACTION_TIME_TABLE) {
    if (REACTION_TIME_TABLE.hasOwnProperty(r)) allResources[r] = true;
  }

  // Factory commodities
  for (var f in FACTORY_COOLDOWN_TABLE) {
    if (FACTORY_COOLDOWN_TABLE.hasOwnProperty(f)) allResources[f] = true;
  }

  // Base minerals + energy
  var bases = ['U','L','Z','K','O','H','G','energy','X'];
  for (var b=0;b<bases.length;b++) allResources[bases[b]] = true;

  var resList = Object.keys(allResources).sort();

  // Filter if requested
  if (resourceFilter && resourceFilter !== 'all') {
    var fr = resolveResource(resourceFilter);
    if (resList.indexOf(fr) === -1) return JSON.stringify({error: 'Unknown resource: '+resourceFilter});
    resList = [fr];
  }

  var data = {
    generated: getPT(),
    timestamp: Date.now(),
    tick: Game.time,
    resources: {}
  };

  for (var i=0;i<resList.length;i++) {
    var res = resList[i];
    var hist = Game.market.getHistory(res) || [];
    var histData = [];
    for (var h=0;h<hist.length;h++) {
      histData.push({
        date: hist[h].date,
        avgPrice: hist[h].avgPrice,
        volume: hist[h].volume
      });
    }
    var buyInfo = computeActualBuyPrice(res);
    var sellInfo = computeActualSellPrice(res);
    var avg48h = getAvg48h(res);
    var buyOrders = getOrderInfo(res, ORDER_BUY);
    var sellOrders = getOrderInfo(res, ORDER_SELL);

    data.resources[res] = {
      history: histData,
      avg48h: avg48h,
      actualBuy: { price: buyInfo.price, source: buyInfo.source, volume: buyInfo.volume, orderCount: buyInfo.orderCount },
      actualSell: { price: sellInfo.price, source: sellInfo.source, volume: sellInfo.volume, orderCount: sellInfo.orderCount },
      spread: (buyInfo.price !== null && sellInfo.price !== null) ? sellInfo.price - buyInfo.price : null,
      spreadPct: (buyInfo.price !== null && sellInfo.price !== null && buyInfo.price > 0) ? ((sellInfo.price - buyInfo.price) / buyInfo.price * 100) : null,
      orderBook: {
        buys: {
          count: buyOrders.count,
          totalVolume: buyOrders.totalVolume,
          bestPrice: buyOrders.bestPrice,
          orders: buyOrders.orders.map(function(o) {
            return {
              id: o.id,
              price: o.price,
              amount: o.remainingAmount || o.amount || 0,
              roomName: o.roomName || null
            };
          })
        },
        sells: {
          count: sellOrders.count,
          totalVolume: sellOrders.totalVolume,
          bestPrice: sellOrders.bestPrice,
          orders: sellOrders.orders.map(function(o) {
            return {
              id: o.id,
              price: o.price,
              amount: o.remainingAmount || o.amount || 0,
              roomName: o.roomName || null
            };
          })
        }
      }
    };
  }

  // Energy reference
  var eInfo = computeActualBuyPrice(RESOURCE_ENERGY);
  data.energyPrice = eInfo.price;
  data.energySource = eInfo.source;

  // Optional: full analysis (forward/reverse/factory/decompression)
  if (includeAnalysis === true) {
    var rp = buildReactionMap();
    var ownSell = buildOwnSellResourceSet();
    data.analysis = {};
    data.factory = {};
    data.decompression = {};

    for (var ri=0;ri<resList.length;ri++) {
      var res = resList[ri];
      // Forward
      var fwd = analyzeLabProduct(res, rp, 'ACTUAL_SELL', 'ACTUAL_BUY', ownSell);
      if (fwd && fwd.found) {
        data.analysis[res] = data.analysis[res] || {};
        data.analysis[res].forward = {
          reagents: [fwd.reagentA, fwd.reagentB],
          costPerBatch: fwd.reagentCost,
          creepCostPerBatch: fwd.creepCostPerBatch,
          totalCost: fwd.inputCost,
          revenue: fwd.revenue,
          profit: fwd.profit,
          profitPerUnit: fwd.profitPerUnit,
          marginPct: fwd.marginPct,
          reactionTime: fwd.reactionTime,
          actionable: fwd.actionable
        };
      }
      // Reverse
      var rev = analyzeReverseReaction(res, rp, 'ACTUAL_SELL', 'ACTUAL_BUY', ownSell);
      if (rev && rev.found) {
        data.analysis[res] = data.analysis[res] || {};
        data.analysis[res].reverse = {
          reagents: [rev.reagentA, rev.reagentB],
          compoundPrice: rev.compoundPrice,
          isOwnInventory: rev.isOwnInventory,
          revenue: rev.revenue,
          profit: rev.profit,
          profitPerUnit: rev.profitPerUnit,
          marginPct: rev.marginPct,
          actionable: rev.actionable
        };
      }
      // Factory compression
      var fc = analyzeFactoryCommodity(res, 'ACTUAL_SELL', 'ACTUAL_BUY');
      if (fc && fc.found) {
        data.factory[res] = {
          outputQty: fc.outQty,
          unitPrice: fc.unitPrice,
          ingredientCost: fc.ingredientCost,
          creepCostPerRun: fc.creepCostPerRun,
          totalCost: fc.inputCost,
          revenue: fc.revenue,
          profit: fc.profit,
          profitPerUnit: fc.profitPerUnit,
          marginPct: fc.marginPct,
          cooldown: fc.cooldown,
          actionable: fc.actionable
        };
      }
      // Decompression
      var dc = analyzeFactoryDecompression(res, 'ACTUAL_SELL', 'ACTUAL_BUY');
      if (dc && dc.found) {
        data.decompression[res] = {
          barName: dc.barName,
          outputQty: dc.outQty,
          barPrice: dc.barPrice,
          ingredientCost: dc.ingredientCost,
          creepCostPerRun: dc.creepCostPerRun,
          totalCost: dc.inputCost,
          unitPrice: dc.unitPrice,
          revenue: dc.revenue,
          profit: dc.profit,
          profitPerUnit: dc.profitPerUnit,
          marginPct: dc.marginPct,
          cooldown: dc.cooldown,
          actionable: dc.actionable
        };
      }
    }
  }

  return JSON.stringify(data, null, 2);
};