import useSWR from "swr";
import { Instance } from "../../instances/_lib/instances.d";
import { StandardResponse } from "../../../_lib/response";
import { jsonFetcher } from "../../../_lib/fetcher";

export function useInstance(name: string | null, config?: any) {
    const { data, error, isLoading, mutate } = useSWR<StandardResponse<Instance>>(
        name ? `/1.0/instances/${name}?recursion=1` : null,
        jsonFetcher,
        config
    );

    return {
        instance: data?.metadata,
        isLoading,
        isError: error,
        mutate,
    };
}

export function useInstanceAccess(name: string | null) {
    const { data, error, isLoading } = useSWR<StandardResponse<string[]>>(
        name ? `/1.0/instances/${name}/access` : null,
        jsonFetcher
    );

    return {
        access: data?.metadata,
        isLoading,
        isError: error,
    };
}
