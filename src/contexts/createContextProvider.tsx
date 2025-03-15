import { createContext } from "react";

export const createContextProvider = <T,>(defaultValues: T | null = null) => {
	const context = createContext(defaultValues);

	const Provider = ({ children }: { children: React.ReactNode }) => {
		return <context.Provider value={defaultValues}>{children}</context.Provider>;
	};

	return [Provider, context] as const;
};
