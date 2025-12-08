import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit, startAfter, startAt, endAt, getDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const token = request.headers.get('Authorization');
  if (token !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limitCount = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const lastId = searchParams.get('lastId');

    console.log(`[Admin API] Fetching puzzles. Search: '${search}', Limit: ${limitCount}, LastId: ${lastId}`);

    const puzzlesRef = collection(db, "puzzles");
    let constraints: any[] = [];

    // Search logic
    if (search) {
      // Prefix search on title
      constraints.push(orderBy("title"));
      constraints.push(startAt(search));
      constraints.push(endAt(search + '\uf8ff'));
    } else {
      // Default sort by createdAt desc
      constraints.push(orderBy("createdAt", "desc"));
    }

    // Pagination logic
    if (lastId) {
      const lastDocRef = doc(db, "puzzles", lastId);
      const lastDocSnap = await getDoc(lastDocRef);
      if (lastDocSnap.exists()) {
        constraints.push(startAfter(lastDocSnap));
      }
    }

    constraints.push(limit(limitCount));

    const q = query(puzzlesRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const puzzles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const lastVisible = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1].id : null;

    return NextResponse.json({ puzzles, lastId: lastVisible });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch puzzles' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const token = request.headers.get('Authorization');
  if (token !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing puzzle ID' }, { status: 400 });
    }

    await deleteDoc(doc(db, "puzzles", id));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete puzzle' }, { status: 500 });
  }
}
