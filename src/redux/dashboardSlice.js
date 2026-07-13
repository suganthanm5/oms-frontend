import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getOutlets } from "../services/outletService";
import { getLocations } from "../services/locationService";
import { getDivisions } from "../services/divisionService";

const extractList = (res) => {
 
  const data = res?.value?.data || res?.value || res?.data;
  if (!data) return [];


  if (Array.isArray(data)) return data;

  if (Array.isArray(data.data)) return data.data;
  
  if (Array.isArray(data.content)) return data.content;
  if (Array.isArray(data.data?.content)) return data.data.content;

  return [];
};

const enrichOutlets = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.map((o) => {
    let divObjs = [];
    if (Array.isArray(o.divisions)) {
      divObjs = o.divisions;
    } else if (Array.isArray(o.mappings) && o.mappings.length > 0) {
      const divisionMap = new Map();
      o.mappings.forEach((mapping) => {
        const divId = mapping.divisionId || mapping.division?.id;
        const divName = mapping.divisionName || mapping.division?.name;
        if (divId) {
          if (!divisionMap.has(divId)) divisionMap.set(divId, { id: divId, name: divName, products: [] });
          const prodId = mapping.productId || mapping.product?.id;
          const prodName = mapping.productName || mapping.product?.name;
          const prodCode = mapping.productCode || mapping.product?.productCode;
          if (prodId) divisionMap.get(divId).products.push({ id: prodId, name: prodName, productCode: prodCode });
        }
      });
      divObjs = Array.from(divisionMap.values());
    } else if (o.division) {
      divObjs = [o.division];
    }

    let allProducts = [];
    divObjs.forEach((d) => {
      if (Array.isArray(d.products))
        allProducts = allProducts.concat(d.products.map((p) => ({ ...p, divisionName: d.name })));
    });

    return {
      ...o,
      locationName: o.locationName || o.location?.name || null,
      divisions: divObjs,
      divisionIds: divObjs.map((d) => d.id).filter(Boolean),
      divisionNames: divObjs.map((d) => d.name).filter(Boolean),
      productNames: allProducts.map((p) => p.name).filter(Boolean),
      allProducts,
      ownerName: o.ownerName ?? null,
      address: o.address ?? null,
    };
  });
};

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const results = await Promise.allSettled([
        getOutlets(0, 1000),
        getLocations(0, 1000),
        getDivisions(0, 1000),
      ]);

      const [o, l, d] = results;

      // Log failures if any
      results.forEach((res, idx) => {
        if (res.status === "rejected") {
          const names = ["Outlets", "Locations", "Divisions"];
          console.error(`❌ ${names[idx]} fetch failed:`, res.reason);
        }
      });

      return {
        outlets: enrichOutlets(extractList(o)),
        locations: extractList(l),
        divisions: extractList(d),
      };
    } catch (error) {
      console.error("❌ Dashboard fetch error:", error);
      return rejectWithValue(error.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    outlets: [],
    locations: [],
    divisions: [],
    loading: true,
  },
  reducers: {
    setDashboardData: (state, action) => {
      state.outlets = enrichOutlets(action.payload.outlets);
      state.locations = action.payload.locations;
      state.divisions = action.payload.divisions;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    addOutlet: (state, action) => {
      const enriched = enrichOutlets([action.payload])[0] || action.payload;
      state.outlets.unshift(enriched);
    },
    addLocation: (state, action) => {
      state.locations.unshift(action.payload);
    },
    addDivision: (state, action) => {
      state.divisions.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.outlets = action.payload.outlets;
        state.locations = action.payload.locations;
        state.divisions = action.payload.divisions;
        state.loading = false;
      });
  },
});

export const { setDashboardData, setLoading, addOutlet, addLocation, addDivision } = dashboardSlice.actions;
export default dashboardSlice.reducer;
