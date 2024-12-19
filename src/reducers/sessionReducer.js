import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loadFriends } from '../reducers/memberListReducer';

export const login = createAsyncThunk(
  'session/login',
  async ({ bapId }, { dispatch, rejectWithValue }) => {
    try {
      // const response = await userAPI.login(userInfo);
      // console.log("login", bapId);
      dispatch(setBapId(bapId));
      dispatch(loadFriends());

      return bapId;
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  },
);

// export const signup = createAsyncThunk(
//   "session/signup",
//   async (userInfo, { dispatch, rejectWithValue }) => {
//     try {
//       await userAPI.signup(userInfo);
//       return dispatch(login(userInfo));
//     } catch (err) {
//       return rejectWithValue(err.response.data);
//     }
//   }
// );

const initialState = {
  isAuthenticated: false,
  loading: false,
  user: null,
  error: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    connectSocket(_state, _action) {},
    logout(state, _action) {
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
      state.error = null;
    },
    setBapId(state, action) {
      // console.log("setting bap id to", action.payload);
      const newUser = Object.assign({}, state.user || {});
      newUser.idKey = action.payload;
      state.user = newUser;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state, _action) => {
        state.loading = true;
        state.isAuthenticated = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        if (!state.user) {
          state.user = {};
        }
        state.user.idKey = action.payload;
        // console.log("login fullfulled", action.payload);
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload;
      });
    // .addCase(signup.pending, (state, action) => {
    //   state.loading = true;
    // })
    // .addCase(signup.fulfilled, (state, action) => {
    //   state.loading = false;
    //   state.error = null;
    // })
    // .addCase(signup.rejected, (state, action) => {
    //   state.loading = false;
    //   state.error = action.payload;
    // });
  },
});

export const { connectSocket, logout, setBapId } = sessionSlice.actions;

export default sessionSlice.reducer;
