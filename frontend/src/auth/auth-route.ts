import { User } from "./types";

export function getDashboardRoute(user: User): string {

    if (user.role.isSuperAdmin) {
        return "/super-admin/dashboard";
    }

    if (user.role.isCompanyAdmin) {
        return "/company/dashboard";
    }

    return "/unauthorized";
}

export function isProtectedRoute(pathname: string) {

    return (
        pathname.startsWith("/super-admin") ||
        pathname.startsWith("/company")
    );

}

export function isPublicRoute(pathname: string) {

    return (
        pathname === "/login" ||
        pathname === "/"
    );

}