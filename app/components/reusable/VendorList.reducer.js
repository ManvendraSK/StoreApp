import { VENDOR_LIST_SELECT, VENDOR_LIST_CLEAR } from './VendorList.actions';

const initialState = {
  vendor: {
    No: 'VEND0001',
    Name: 'Advanced Commerce Establishment for Import and Exp',
    Currency_Code: ''
  }
};

export default function vendorList(state = initialState, action) {
  switch (action.type) {
    case VENDOR_LIST_SELECT:
      return { ...state, vendor: action.vendor };
    case VENDOR_LIST_CLEAR:
      return initialState;
    default:
      return state;
  }
}
