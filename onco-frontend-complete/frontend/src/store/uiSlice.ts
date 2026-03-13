import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loadingCount: 0,
  confirm: {
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  },
  notice: {
    open: false,
    kind: 'info',
    text: '',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    startLoading(state) {
      state.loadingCount += 1;
    },
    stopLoading(state) {
      state.loadingCount = Math.max(0, state.loadingCount - 1);
    },
    openConfirm(state, action) {
      state.confirm = { open: true, ...action.payload };
    },
    closeConfirm(state) {
      state.confirm = { ...initialState.confirm };
    },
    showNotice(state, action) {
      state.notice = { open: true, kind: 'info', ...action.payload };
    },
    hideNotice(state) {
      state.notice = { ...initialState.notice };
    },
  },
});

export const { startLoading, stopLoading, openConfirm, closeConfirm, showNotice, hideNotice } = uiSlice.actions;
export default uiSlice.reducer;
