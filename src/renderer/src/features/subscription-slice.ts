import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { KrakenCloudFeature } from "@types";

export interface SubscriptionState {
  isKrakenCloudModalVisible: boolean;
  feature: KrakenCloudFeature | "";
}

const initialState: SubscriptionState = {
  isKrakenCloudModalVisible: false,
  feature: "",
};

export const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    setKrakenCloudModalVisible: (
      state,
      action: PayloadAction<KrakenCloudFeature>
    ) => {
      state.isKrakenCloudModalVisible = true;
      state.feature = action.payload;
    },
    setKrakenCloudModalHidden: (state) => {
      state.isKrakenCloudModalVisible = false;
    },
  },
});

export const { setKrakenCloudModalVisible, setKrakenCloudModalHidden } =
  subscriptionSlice.actions;
