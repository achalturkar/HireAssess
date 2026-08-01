import { superAdminMenu } from "@/src/config/super-admin-menu";
import { companyMenu } from "@/src/config/company-menu";

export function buildMenu(user){

    if(!user){

        return [];

    }

    if(user.role.isSuperAdmin){

        return superAdminMenu.filter(item=>{

            if(item.permission===null){

                return true;

            }

            return user.permissions.includes(item.permission);

        });

    }

    if(user.role.isCompanyAdmin){

        return companyMenu.filter(item=>{

            if(item.permission===null){

                return true;

            }

            return user.permissions.includes(item.permission);

        });

    }

    return [];

}