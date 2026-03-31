/**
 * Core Analytics Logic for Mileage Tracker
 * FIX: Proper vehicle-grouped calculations, baseline correction
 */

/**
 * Calculates efficiency between current log and previous log.
 */
export const calculateEfficiency = (current, previous) => {
  if (!current || !previous) return 0;
  const distance = Number(current.odometer) - Number(previous.odometer);
  const liters = Number(previous.liters);
  if (distance <= 0 || liters <= 0) return 0;
  return Number((distance / liters).toFixed(2));
};

/**
 * FIX: Generates monthly efficiency/spending trends — properly groups by vehicle
 */
export const getMonthlyTrends = (entries) => {
  if (entries.length < 2) return [];
  
  // Group entries by vehicle first
  const byVehicle = {};
  entries.forEach(entry => {
    if (!byVehicle[entry.vehicleId]) byVehicle[entry.vehicleId] = [];
    byVehicle[entry.vehicleId].push(entry);
  });

  // Sort each vehicle's entries by date
  Object.values(byVehicle).forEach(vehicleEntries => {
    vehicleEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
  });

  const trends = {};
  
  // Calculate efficiency per entry within each vehicle group
  Object.values(byVehicle).forEach(vehicleEntries => {
    vehicleEntries.forEach((entry, i) => {
      const date = new Date(entry.date);
      const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear().toString().substr(-2)}`;
      if (!trends[monthKey]) trends[monthKey] = { efficiency: 0, count: 0, spend: 0 };
      
      if (i > 0) {
        const prev = vehicleEntries[i - 1];
        const eff = calculateEfficiency(entry, prev);
        if (eff > 0) {
          trends[monthKey].efficiency += eff;
          trends[monthKey].count += 1;
        }
      }
      trends[monthKey].spend += Number(entry.cost);
    });
  });

  return Object.keys(trends).map(month => ({
    month,
    efficiency: trends[month].count > 0 ? Number((trends[month].efficiency / trends[month].count).toFixed(1)) : 0,
    spend: trends[month].spend
  })).slice(-6);
};

/**
 * FIX: Calculates per-vehicle efficiency stats with proper baseline
 * Uses first odometer reading as baseline instead of assuming 0
 */
export const getVehicleStats = (vehicles, entries) => {
  return vehicles.map(vehicle => {
    const ve = entries
      .filter(e => e.vehicleId === vehicle.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const efficiencyLogs = ve.map((e, i) => calculateEfficiency(e, ve[i - 1])).filter(v => v > 0);
    
    // FIX: Use actual distance between first and last odometer, not just last odometer
    const firstOdo = ve.length > 0 ? Number(ve[0].odometer) : 0;
    const lastOdo = ve.length > 0 ? Number(ve[ve.length - 1].odometer) : null;
    const totalKm = lastOdo !== null ? lastOdo - firstOdo : 0;
    
    // Total fuel used (excluding the last entry since it covers distance beyond our tracking)
    const fuelTillPenultimate = ve.length > 1 
      ? ve.slice(0, -1).reduce((sum, e) => sum + Number(e.liters || 0), 0)
      : 0;
      
    const avgEff = totalKm > 0 && fuelTillPenultimate > 0
      ? Number((totalKm / fuelTillPenultimate).toFixed(1))
      : null;

    const totalCost = ve.reduce((s, e) => s + Number(e.cost || 0), 0);
    const totalLiters = ve.reduce((s, e) => s + Number(e.liters || 0), 0);
    const costPerKm = totalKm > 0 ? Number((totalCost / totalKm).toFixed(2)) : null;
    const avgPricePerL = totalLiters > 0 ? Number((totalCost / totalLiters).toFixed(1)) : null;

    // Trend: compare last 2 efficiencies
    let trend = 'neutral';
    if (efficiencyLogs.length >= 2) {
      const last = efficiencyLogs[efficiencyLogs.length - 1];
      const prev = efficiencyLogs[efficiencyLogs.length - 2];
      if (last > prev * 1.03) trend = 'up';
      else if (last < prev * 0.97) trend = 'down';
    }

    // Fuel price trend
    const recentPrices = ve.slice(-5).map(e => {
      const liters = Number(e.liters);
      const cost = Number(e.cost);
      return liters > 0 ? cost / liters : 0;
    }).filter(p => p > 0);
    
    let priceTrend = 'neutral';
    if (recentPrices.length >= 2) {
      const lastPrice = recentPrices[recentPrices.length - 1];
      const prevPrice = recentPrices[recentPrices.length - 2];
      if (lastPrice > prevPrice * 1.02) priceTrend = 'up';
      else if (lastPrice < prevPrice * 0.98) priceTrend = 'down';
    }

    return { 
      vehicle, avgEff, totalCost, totalKm, costPerKm, avgPricePerL, 
      logsCount: ve.length, trend, fuelForMileage: fuelTillPenultimate,
      priceTrend, lastOdometer: lastOdo
    };
  });
};

/**
 * Calculates trip statistics grouped by purpose.
 */
export const getTripStats = (trips) => {
  const byPurpose = {};
  trips.forEach(t => {
    const dist = Number(t.endOdometer) - Number(t.startOdometer);
    const p = t.purpose || 'Other';
    if (!byPurpose[p]) byPurpose[p] = { count: 0, km: 0 };
    byPurpose[p].count++;
    byPurpose[p].km += dist;
  });
  return byPurpose;
};

/**
 * Checks for anomalies and maintenance needs.
 */
export const checkAlerts = (vehicles, entries) => {
  const alerts = [];
  vehicles.forEach(vehicle => {
    const vehicleEntries = entries
      .filter(e => e.vehicleId === vehicle.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    if (vehicleEntries.length === 0) return;

    const latestOdo = Number(vehicleEntries[vehicleEntries.length - 1].odometer);

    // Service Interval Check
    if (vehicle.serviceInterval) {
      const lastServiceOdo = Number(vehicle.lastServiceOdo || 0);
      const kmSince = latestOdo - lastServiceOdo;
      const interval = Number(vehicle.serviceInterval);
      if (kmSince >= interval) {
        alerts.push({
          type: 'service_overdue',
          vehicleId: vehicle.id,
          message: `${vehicle.name} is overdue for service! ${kmSince.toLocaleString()} KM since last service (interval: ${interval.toLocaleString()} KM).`
        });
      } else if (kmSince >= interval * 0.85) {
        alerts.push({
          type: 'service_due',
          vehicleId: vehicle.id,
          message: `${vehicle.name} service due in ${(interval - kmSince).toLocaleString()} KM.`
        });
      }
    }

    // Efficiency Drop Check
    if (vehicleEntries.length >= 3) {
      const e1 = vehicleEntries[vehicleEntries.length - 1];
      const e2 = vehicleEntries[vehicleEntries.length - 2];
      const e3 = vehicleEntries[vehicleEntries.length - 3];
      const eff1 = calculateEfficiency(e1, e2);
      const eff2 = calculateEfficiency(e2, e3);
      if (eff1 > 0 && eff2 > 0 && eff1 < eff2 * 0.85) {
        alerts.push({
          type: 'efficiency_drop',
          vehicleId: vehicle.id,
          message: `Efficiency drop for ${vehicle.name}: ${eff1} km/L (was ${eff2} km/L). Check tires or air filter.`
        });
      }
    }
  });
  return alerts;
};

/**
 * NEW: Get fuel price history for trend tracking
 */
export const getFuelPriceTrends = (entries) => {
  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  return sorted.map(e => {
    const liters = Number(e.liters);
    const cost = Number(e.cost);
    return {
      date: e.date,
      vehicleId: e.vehicleId,
      pricePerLiter: liters > 0 ? Number((cost / liters).toFixed(2)) : 0,
    };
  }).filter(p => p.pricePerLiter > 0);
};
