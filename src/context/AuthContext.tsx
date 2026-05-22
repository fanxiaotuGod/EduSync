/**
 * AuthContext — global authentication state / 全局认证状态
 After login, the whole app should know who is the user and any component can read the user info or call login/logout
 */


//这个文件的作用是整个系统的认证中枢//

//createContext -> create a global container -> 全局容器//
//useState -> stores data that can change -> 存储可变数据//
//useCallback -> stores a function that can be called later -> 存储可调用函数//
//useEffect -> perform side effects -> 执行副作用//
//useMemo -> memoize a value -> 记忆化值//
//type ReactNode -> a type for React nodes -> 一个用于React节点的类型//

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Keys used in localStorage — keep stable / localStorage 键名，不要随意改名 */
const STORAGE_KEY_TOKEN = "edusync_token";
const STORAGE_KEY_USER = "edusync_user";

/**
 * Logged-in user shape for the UI layer / 前端使用的「当前用户」结构
 * `name` maps from API `display_name` when you call login() / name 对应后端返回的 display_name
 */
export interface AuthUser {
  /** User id (UUID from backend) / 用户唯一 id（后端 UUID） */
  id: string;
  /** Display name shown in header, etc. / 界面显示的名字 */
  name: string;
  /** Role: e.g. teacher, student, admin / 角色：如 teacher、student、admin */
  role: string;
  /** Optional email / 可选邮箱 */
  email?: string;
}
// the ? in email: mean optional//

type AuthContextValue = {
  /** Current user or null if logged out / 当前用户；未登录为 null */
  user: AuthUser | null;
  /** JWT or access token from your API / 接口返回的 JWT 或 access token */
  token: string | null;
  /** True when both token and user exist / 同时有 token 和 user 时为 true */
  isAuthenticated: boolean;
  /**
   * Save session after successful API login / 登录接口成功后调用，写入内存 + localStorage
   * @param newToken — token string from `POST /api/auth/login` / 登录接口返回的 token 字符串
   * @param newUser — minimal user object (id, name, role) / 至少包含 id、name、role
   */
  login: (newToken: string, newUser: AuthUser) => void;
  /** Clear session everywhere / 清除内存与 localStorage 中的登录信息 */
  logout: () => void;
};

//创建全局容器 全局容器是用来存储全局状态的 ， 注意这里只是声明了全局容器，还没有初始化，数据是放在下面的AuthProvider里放进去的//
//provider是装东西， useAuth是从箱子里取东西//
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

//this function get user from localStorafe and check it and ensure all the fields are present and valid -> 确保所有字段都在才返回//
//因为用户可以在浏览器改， 所以不能直接使用JSON.parse， 万一机构不对 后面访问user.name会报错//
//the outer try/catch handles corrupted JSON that would crash JASON.parse//
function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "id" in parsed &&
      "name" in parsed &&
      "role" in parsed
    ) {
      const o = parsed as Record<string, unknown>;
      return {
        id: String(o.id),
        name: String(o.name),
        role: String(o.role),
        email: o.email != null ? String(o.email) : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

//AuthProvider wraps other components and pass auth data down//
//Initial values are null -> the real values are resotred from localStorage in the useEffect below//
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Hydrate from localStorage once on mount / 挂载时从 localStorage 恢复一次（避免刷新丢登录）//
  // when the page refresh, React state resets to null, but localStorage still has the token, therefore this effecr can put back, restoring the logged-in state//
  //这样用户就不需要重新登陆了//
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const storedUser = readStoredUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
  }, []);

  //每次调用login函数时， 会更新React state和localStorage 刷新页面保持稳定//
  //useCallback -> 让这个函数稳定不变， 不会因为组件重新渲染而重新创建， 提高性能//
  const login = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
  }, []);

  //logout函数：清空 state + 删除 localStorage。//
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  }, []);

  //packages everything into one object for child components.//
  //useMemo -> only recreates this object when the its dependencies change.//
  //isAuthenticated 是一个便利字段——Boolean(token && user) 意思是"token 和 user 同时存在才是 true"，任意一个是 null 就是 false。
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
    }),
    [user, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

//this is how components access auth date//
//write const{user, login} = useAuth() anywhere inside AuthProvider//
//the check gives a clear error if someone forgets to wrap AuthProvider in main.tsx//
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error(
      "useAuth must be used within AuthProvider / useAuth 必须在 AuthProvider 内部使用"
    );
  }
  return ctx;
}
