import { useRouter } from "expo-router"

/**
 * @file useNavigateToSession.ts
 * @input None
 * @output Navigation function to session detail page
 * @pos Navigation hook for session detail with optional accessLevel parameter (Phase 7)
 */

export type SessionAccessLevel = 'owner' | 'view' | 'collaborate';

export function useNavigateToSession() {
    const router = useRouter();
    return (sessionId: string, accessLevel?: SessionAccessLevel) => {
        const queryParams = accessLevel ? `?accessLevel=${accessLevel}` : '';
        router.navigate(`/session/${sessionId}${queryParams}`, {
            dangerouslySingular(name, params) {
                return 'session'
            },
        });
    }
}