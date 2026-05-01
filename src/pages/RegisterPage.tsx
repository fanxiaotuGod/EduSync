// here import some necessary libraries and components//
//from react to import 管理状态 and 表单时间类型//
//这里是在引入工具//
import {useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
//组件定义 + 状态变量//
// this defines a react functional component called RegisterPage//
//useState create a state variable and initializes it to an empty string. This variable will be used to store the user's name input.//
//[name, setName] return two things one is the current value and setName is a function that can be used to update the value of name.//
export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");

    // ✅ [错误修复: 函数作用域] handleSubmit 必须写在组件函数体内部。
    // 原来第19行有多余的 } 提前关闭了 RegisterPage，导致 handleSubmit 和 return 都跑到组件外面。
    // 知识点：React 组件是一个函数，state 变量、事件处理函数、return JSX 必须全部在同一个函数体 {} 内。
    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
    }
    // 现在展示不加点击按钮触发 day3在这里加上API调用//

    //px-4 means padding -> p ; x means left and right ; 4 means the size of the padding, in this case it is 1rem (16px)//

    // ✅ [错误修复: 函数作用域] return 同样必须在组件函数体内部，否则组件没有返回值，React 无法渲染任何内容。
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm space-y-5 rounded-lg border border-border/60 bg-card p-6 shadow-sm"
            >
            <div className="space-y-1">
                {/* ✅ [错误修复: 拼写错误] front-semibold → font-semibold */}
                {/* 知识点：Tailwind CSS 的字体粗细类名前缀是 font-，不是 front- */}
                <h1 className="text-lg font-semibold tracking-tight">Register</h1>
                {/* ✅ [错误修复: 拼写错误] text-numted-forground → text-muted-foreground，asscount → account */}
                {/* 知识点：Tailwind CSS 颜色类名是 muted-foreground；foreground 不要漏写 e */}
                <p className="text-sm text-muted-foreground">Create your EduSync account</p>
            </div>
            <div className="space-y-4">

                {/* ✅ [错误修复: 拼写错误] spacy-y-1.5 → space-y-1.5 */}
                {/* 知识点：Tailwind CSS 纵向间距类名是 space-y-，不是 spacy-y- */}
                <div className="space-y-1.5">
                    <label htmlFor="register-name" className="text-xs">
                        Name
                    </label>
                    {/* This code makes the input field controlled by React state */}
                    <Input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="h-9"
                    required
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="register-email" className="text-xs">
                        Email
                    </Label>
                    <Input
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your Email"
                        className="h-9"
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="register-password" className="text-xs">
                        Password
                    </Label>
                    <Input
                        id="register-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-9"
                        required
                    />
                </div>

                {/* Role dropdown: <select> is a native HTML element that renders a dropdown menu.
                    value={role} makes it a controlled component — React owns the selected value.
                    onChange updates the role state whenever the user picks a different option. */}
                <div className="space-y-1.5">
                    <Label htmlFor="register-role" className="text-xs">
                        Role
                    </Label>
                    <select
                        id="register-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="" disabled>Select your role</option>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                </div>
            </div>

            <Button type="submit" className="w-full h-9">
                Create Account
            </Button>

            {/* Link from react-router-dom navigates between pages without a full browser refresh.
                Unlike <a href="...">, Link uses the client-side router — the page does not reload. */}
            <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                    Log in
                </Link>
            </p>
            </form>
        </div>
    );
}

//组件必须return JSX才能使用state渲染UI//
