import { supabase } from '../services/supabase';

export async function notify({ userId, type, title, body, link }) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        // Don't notify yourself
        if (user && user.id === userId) return;
        await supabase.from("notifications").insert({
            user_id: userId,
            actor_id: user ? user.id : null,
            type, title,
            body: body || null,
            link: link || null,
        });
    } catch (e) { /* notifications are non-critical; never block the action */ }
}
