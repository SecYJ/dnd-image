"use client";

import { ReactNode } from "react";
import { QueryProvider } from "./QueryProvider";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const Providers = ({ children }: { children: ReactNode }) => {
    return (
        <QueryProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
        </QueryProvider>
    );
};

export default Providers;
