/**
 * UltraLog Validation Engine
 * Comprehensive form validation for all entity types
 */

/**
 * Generate a unique ID using crypto API or fallback
 */
export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Ensures all entities in data have unique IDs
 */
export const ensureIds = (data) => {
  const ensured = { ...data };

  // Vehicles already have IDs from Date.now()
  ensured.vehicles = (data.vehicles || []).map(v => ({
    ...v,
    id: v.id || generateId()
  }));

  ensured.entries = (data.entries || []).map(e => ({
    ...e,
    id: e.id || generateId()
  }));

  ensured.trips = (data.trips || []).map(t => ({
    ...t,
    id: t.id || generateId()
  }));

  ensured.services = (data.services || []).map(s => ({
    ...s,
    id: s.id || generateId()
  }));

  ensured.expenses = (data.expenses || []).map(e => ({
    ...e,
    id: e.id || generateId()
  }));

  ensured.income = (data.income || []).map(i => ({
    ...i,
    id: i.id || generateId()
  }));

  ensured.budgets = (data.budgets || []).map(b => ({
    ...b,
    id: b.id || generateId()
  }));

  ensured.accounts = (data.accounts || []).map(a => ({
    ...a,
    id: a.id || generateId()
  }));

  return ensured;
};

/**
 * Validate a fuel entry
 * Returns { valid: boolean, errors: { fieldName: message }, warnings: string[] }
 */
export const validateFuelEntry = (entry, existingEntries = [], vehicles = []) => {
  const errors = {};
  const warnings = [];

  if (!entry.vehicleId) {
    errors.vehicleId = 'Vehicle is required';
  } else if (!vehicles.find(v => v.id === entry.vehicleId)) {
    errors.vehicleId = 'Selected vehicle not found';
  }

  const odometer = Number(entry.odometer);
  if (!entry.odometer || isNaN(odometer)) {
    errors.odometer = 'Odometer reading is required';
  } else if (odometer <= 0) {
    errors.odometer = 'Odometer must be a positive number';
  } else {
    // Check odometer progression
    const vehicleEntries = existingEntries
      .filter(e => e.vehicleId === entry.vehicleId && e.id !== entry.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (vehicleEntries.length > 0) {
      const lastEntry = vehicleEntries[vehicleEntries.length - 1];
      if (odometer < Number(lastEntry.odometer) && new Date(entry.date) >= new Date(lastEntry.date)) {
        warnings.push(`Odometer (${odometer}) is less than previous reading (${lastEntry.odometer}). Verify this is correct.`);
      }
    }
  }

  const liters = Number(entry.liters);
  if (!entry.liters || isNaN(liters)) {
    errors.liters = 'Liters is required';
  } else if (liters <= 0) {
    errors.liters = 'Liters must be positive';
  } else if (liters > 200) {
    warnings.push('Fuel amount exceeds 200L. Verify this is correct.');
  }

  const cost = Number(entry.cost);
  if (!entry.cost || isNaN(cost)) {
    errors.cost = 'Cost is required';
  } else if (cost <= 0) {
    errors.cost = 'Cost must be positive';
  }

  if (!entry.date) {
    errors.date = 'Date is required';
  } else {
    const entryDate = new Date(entry.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (entryDate > today) {
      warnings.push('Date is in the future.');
    }
  }

  // Check for unusually high price per liter
  if (liters > 0 && cost > 0) {
    const ppl = cost / liters;
    if (ppl > 200) {
      warnings.push(`Price per liter (₹${ppl.toFixed(1)}) seems unusually high.`);
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
};

/**
 * Validate a trip entry
 */
export const validateTrip = (trip, vehicles = []) => {
  const errors = {};
  const warnings = [];

  if (!trip.vehicleId) {
    errors.vehicleId = 'Vehicle is required';
  }

  const startOdo = Number(trip.startOdometer);
  const endOdo = Number(trip.endOdometer);

  if (!trip.startOdometer || isNaN(startOdo)) {
    errors.startOdometer = 'Start KM is required';
  } else if (startOdo < 0) {
    errors.startOdometer = 'Start KM must be non-negative';
  }

  if (!trip.endOdometer || isNaN(endOdo)) {
    errors.endOdometer = 'End KM is required';
  } else if (endOdo < 0) {
    errors.endOdometer = 'End KM must be non-negative';
  }

  if (startOdo >= 0 && endOdo >= 0 && endOdo <= startOdo) {
    errors.endOdometer = 'End KM must be greater than Start KM';
  }

  if (!trip.date) {
    errors.date = 'Date is required';
  }

  if (endOdo - startOdo > 2000) {
    warnings.push(`Distance of ${(endOdo - startOdo).toLocaleString()} KM in a single trip seems high.`);
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
};

/**
 * Validate a vehicle entry
 */
export const validateVehicle = (vehicle, existingVehicles = []) => {
  const errors = {};
  const warnings = [];

  if (!vehicle.name || !vehicle.name.trim()) {
    errors.name = 'Vehicle name is required';
  }

  if (!vehicle.regNo || !vehicle.regNo.trim()) {
    errors.regNo = 'Plate number is required';
  } else {
    const duplicate = existingVehicles.find(
      v => v.regNo?.toLowerCase() === vehicle.regNo.toLowerCase() && v.id !== vehicle.id
    );
    if (duplicate) {
      errors.regNo = `A vehicle with plate "${vehicle.regNo}" already exists (${duplicate.name})`;
    }
  }

  const serviceInterval = Number(vehicle.serviceInterval);
  if (vehicle.serviceInterval && (isNaN(serviceInterval) || serviceInterval <= 0)) {
    errors.serviceInterval = 'Service interval must be a positive number';
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
};

/**
 * Validate a service entry
 */
export const validateService = (service, vehicles = []) => {
  const errors = {};
  const warnings = [];

  if (!service.vehicleId) {
    errors.vehicleId = 'Vehicle is required';
  }

  const odometer = Number(service.odometer);
  if (!service.odometer || isNaN(odometer)) {
    errors.odometer = 'Odometer is required';
  } else if (odometer <= 0) {
    errors.odometer = 'Odometer must be positive';
  }

  const cost = Number(service.cost);
  if (!service.cost || isNaN(cost)) {
    errors.cost = 'Cost is required';
  } else if (cost <= 0) {
    errors.cost = 'Cost must be positive';
  }

  if (!service.date) {
    errors.date = 'Date is required';
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
};

/**
 * Validate an expense entry
 */
export const validateExpense = (expense, accounts = []) => {
  const errors = {};
  const warnings = [];

  if (!expense.accountId) {
    errors.accountId = 'Account is required';
  }

  const amount = Number(expense.amount);
  if (!expense.amount || isNaN(amount)) {
    errors.amount = 'Amount is required';
  } else if (amount <= 0) {
    errors.amount = 'Amount must be positive';
  }

  if (!expense.category) {
    errors.category = 'Category is required';
  }

  if (!expense.date) {
    errors.date = 'Date is required';
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
};

/**
 * Validate a budget entry
 */
export const validateBudget = (budget, existingBudgets = []) => {
  const errors = {};
  const warnings = [];

  if (!budget.category) {
    errors.category = 'Category is required';
  }

  const limit = Number(budget.limit);
  if (!budget.limit || isNaN(limit)) {
    errors.limit = 'Limit is required';
  } else if (limit < 0) {
    errors.limit = 'Limit must be non-negative';
  }

  if (!budget.month) {
    errors.month = 'Month is required';
  }

  // Check for duplicate category/month
  const duplicate = existingBudgets.find(
    b => b.category === budget.category && b.month === budget.month && b.id !== budget.id
  );
  if (duplicate) {
    errors.category = `A budget for ${budget.category} already exists for ${budget.month}`;
  }

  return { valid: Object.keys(errors).length === 0, errors, warnings };
};

/**
 * Run data consistency checks on load
 * Returns { cleaned: data, issues: string[] }
 */
export const checkDataConsistency = (data) => {
  const issues = [];
  const cleaned = { ...data };
  const vehicleIds = new Set((data.vehicles || []).map(v => v.id));

  // Remove orphaned fuel entries
  const validEntries = (data.entries || []).filter(e => {
    if (!vehicleIds.has(e.vehicleId)) {
      issues.push(`Removed orphaned fuel entry (vehicle ID: ${e.vehicleId})`);
      return false;
    }
    return true;
  });
  cleaned.entries = validEntries;

  // Remove orphaned trips
  const validTrips = (data.trips || []).filter(t => {
    if (!vehicleIds.has(t.vehicleId)) {
      issues.push(`Removed orphaned trip (vehicle ID: ${t.vehicleId})`);
      return false;
    }
    return true;
  });
  cleaned.trips = validTrips;

  // Remove orphaned services
  const validServices = (data.services || []).filter(s => {
    if (!vehicleIds.has(s.vehicleId)) {
      issues.push(`Removed orphaned service (vehicle ID: ${s.vehicleId})`);
      return false;
    }
    return true;
  });
  cleaned.services = validServices;

  const accountIds = new Set((data.accounts || []).map(a => a.id));

  // Remove orphaned expenses
  cleaned.expenses = (data.expenses || []).filter(e => {
    if (e.accountId && !accountIds.has(e.accountId)) {
      issues.push(`Removed orphaned expense (account ID: ${e.accountId})`);
      return false;
    }
    return true;
  });

  // Remove orphaned income
  cleaned.income = (data.income || []).filter(i => {
    if (i.accountId && !accountIds.has(i.accountId)) {
      issues.push(`Removed orphaned income (account ID: ${i.accountId})`);
      return false;
    }
    return true;
  });

  return { cleaned, issues };
};
