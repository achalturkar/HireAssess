'use client';

import { ReactNode } from "react";
import { useAuth } from "@/src/hooks/useAuth";

interface Props{

roles:string[];

children:ReactNode;

}

export default function RoleGuard({

roles,

children

}:Props){

const{

user

}=useAuth();

if(!user){

return null;

}

const role=user.role.name.toUpperCase();

const allowed=roles.some(r=>r===role);

if(!allowed){

return null;

}

return children;

}