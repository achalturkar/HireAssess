import {

LayoutDashboard,

Users,

UserCircle,

Settings

} from "lucide-react";

export const companyMenu=[

{

key:"dashboard",

label:"Dashboard",

path:"/company/dashboard",

icon:LayoutDashboard,

permission:null

},

{

key:"users",

label:"Users",

path:"/company/users",

icon:Users,

permission:"users.view"

},

{

key:"profile",

label:"Profile",

path:"/company/profile",

icon:UserCircle,

permission:null

},

{

key:"settings",

label:"Settings",

path:"/company/settings",

icon:Settings,

permission:null

}

];