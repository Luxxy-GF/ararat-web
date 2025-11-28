import useSWR from "swr";
import { Instance } from "../../instances/_lib/instances.d";
import { StandardResponse } from "../../../_lib/response";

const fetcher = (...args: Parameters<typeof fetch>) =>
    fetch(...args)
        .then((res) => res.json())
        .then((data) => data.metadata);

export function useInstance(name: string | null, config?: any) {
    const { data, error, isLoading, mutate } = useSWR<Instance>(
        name ? `/1.0/instances/${name}?recursion=1` : null,
        fetcher,
        config
    );

    return {
        instance: data,
        isLoading,
        isError: error,
        mutate,
    };
}

export function useInstanceAccess(name: string | null) {
    const { data, error, isLoading } = useSWR<string[]>(
        name ? `/1.0/instances/${name}/access` : null,
        fetcher
    );

    return {
        access: data,
        isLoading,
        isError: error,
    };
}
