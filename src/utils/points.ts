import { supabase } from '../lib/supabase';

export async function addPoints(
  userId: string,
  points: number,
  actionType: 'order' | 'review' | 'referral' | 'expiration',
  referenceId: string | null,
  description: string
) {
  try {
    const { error } = await supabase.rpc('add_user_points', {
      p_user_id: userId,
      p_points: points,
      p_action_type: actionType,
      p_reference_id: referenceId,
      p_description: description
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
} 