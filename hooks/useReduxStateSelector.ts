import { TypedUseSelectorHook, useSelector } from 'react-redux'
import type { IReduxState } from '../redux/StoreConfig'

export const useReduxStateSelector: TypedUseSelectorHook<IReduxState> = useSelector