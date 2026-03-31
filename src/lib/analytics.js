/**
 * Core Analytics Logic for Mileage Tracker
 */

/**
 * Calculates efficiency between current log and previous log.
 */
export const calculateEfficiency = (current, previous) => {
  if (!current || !previous) return 0;
  const distance = Number(current.odometer) - Number(previous.odometer);
  // Mileage calculation assumes fuel from previous entry powers current interval distance
  const liters = Number(previous.liters);
  if (distance <= 0 || liters <= 0) return 0;
  return Number((distance / liters).toFixed(2));
};

/**
 * Generates monthly efficiency/spending trends.
 */
export const getMonthlyTrends = (entries) => {
  if (entries.length < 2) return [];
  const trends = {};
  entries.forEach((entry, i) => {
    const date = new Date(entry.date);
    const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear().toString().substr(-2)}`;
    if (!trends[monthKey]) trends[monthKey] = { efficiency: 0, count: 0, spend: 0 };
    const prev = entries.slice(0, i).reverse().find(pe => pe.vehicleId === entry.vehicleId);
    const eff = calculateEfficiency(entry, prev);
    if (eff > 0) { trends[monthKey].efficiency += eff; trends[monthKey].count += 1; }
    trends[monthKey].spend += Number(entry.cost);
  });
  return Object.keys(trends).map(month => ({
    month,
    efficiency: trends[month].count > 0 ? Number((trends[month].efficiency / trends[month].count).toFixed(1)) : 0,
    spend: trends[month].spend
  })).slice(-6);
};

/**
 * Calculates per-vehicle efficiency stats.
 */
export const getVehicleStats = (vehicles, entries) => {
  return vehicles.map(vehicle => {
    const ve = entries
      .filter(e => e.vehicleId === vehicle.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const efficiencyLogs = ve.map((e, i) => calculateEfficiency(e, ve[i - 1])).filter(v => v > 0);
    
    // Overall Mileage calculation per user formula: 
    // Total distance (last odo) / Total fuel used till one before last entry
    const lastOdo = ve.length > 0 ? Number(ve[ve.length - 1].odometer) : null;
    const fuelTillPenultimate = ve.length > 1 
      ? ve.slice(0, -1).reduce((sum, e) => sum + Number(e.liters || 0), 0)
      : 0;
      
    const avgEff = lastOdo !== null && fuelTillPenultimate > 0
      ? Number((lastOdo / fuelTillPenultimate).toFixed(1))
      : null;

    const totalCost = ve.reduce((s, e) => s + Number(e.cost || 0), 0);
    const totalLiters = ve.reduce((s, e) => s + Number(e.liters || 0), 0);
    const totalKm = lastOdo || 0;
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

    return { vehicle, avgEff, totalCost, totalKm, costPerKm, avgPricePerL, logsCount: ve.length, trend, fuelForMileage: fuelTillPenultimate };
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
