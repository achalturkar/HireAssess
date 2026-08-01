'use client';

import { ReactNode } from "react";

import { useAuth } from "@/src/hooks/useAuth";

interface Props{

permission:string;

children:ReactNode;

}

export default function PermissionGuard({

permission,

children

}:Props){

const{

permissions

}=useAuth();

if(!permissions.includes(permission)){

return null;

}

return children;

}