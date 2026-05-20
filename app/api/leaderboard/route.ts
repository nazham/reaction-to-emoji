import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis from Upstash
const redis = Redis.fromEnv();

export async function GET() {
  try {
    const leaderboard = await redis.zrange('leaderboard', 0, 9, { rev: true, withScores: true });

    const formatted = [];
    if (Array.isArray(leaderboard)) {
        if (leaderboard.length > 0 && typeof leaderboard[0] === 'object' && leaderboard[0] !== null) {
            return NextResponse.json(leaderboard);
        } else {
            for (let i = 0; i < leaderboard.length; i += 2) {
                formatted.push({ member: leaderboard[i], score: Number(leaderboard[i + 1]) });
            }
            return NextResponse.json(formatted);
        }
    }

    return NextResponse.json(leaderboard || []);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { username, score } = await request.json();

    if (!username || typeof score !== 'number') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const leaderboard = await redis.zrange('leaderboard', 0, 9, { rev: true, withScores: true });

    let qualifies = true;
    if (Array.isArray(leaderboard) && leaderboard.length > 0) {
       let lowestScore = 0;

       if (typeof leaderboard[0] === 'object' && leaderboard[0] !== null) {
           if (leaderboard.length >= 10) {
               lowestScore = Number((leaderboard[leaderboard.length - 1] as any).score);
           }
       } else {
           if (leaderboard.length >= 20) {
               lowestScore = Number(leaderboard[leaderboard.length - 1]);
           }
       }

       if (leaderboard.length >= 10 && typeof leaderboard[0] === 'object' && score <= lowestScore) {
           qualifies = false;
       } else if (leaderboard.length >= 20 && typeof leaderboard[0] !== 'object' && score <= lowestScore) {
           qualifies = false;
       }
    }

    if (!qualifies) {
        return NextResponse.json({ error: 'Score is not high enough for top 10' }, { status: 400 });
    }

    await redis.zadd('leaderboard', { score, member: username });

    await redis.zremrangebyrank('leaderboard', 0, -11);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
