import Link from 'next/link';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Sidebar({ user }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  console.log("Sidebar User:", user); // Debugging

  return (
    <div className="w-64 bg-gray-800 text-white p-4 flex flex-col h-screen fixed left-0 top-0">
      <h1 className="text-2xl font-bold mb-8">Codeforces Tracker</h1>
      <nav className="flex-grow">
        <ul className="space-y-2">
          <li><Link href="/" className="block py-2 px-4 hover:bg-gray-700 rounded">Home</Link></li>
          <li><Link href="/contests" className="block py-2 px-4 hover:bg-gray-700 rounded">Contests</Link></li>
          <li><Link href="/problemset" className="block py-2 px-4 hover:bg-gray-700 rounded">Problemset</Link></li>
          <li><Link href="/friends" className="block py-2 px-4 hover:bg-gray-700 rounded">Friends</Link></li>
          <li><Link href="/submissions" className="block py-2 px-4 hover:bg-gray-700 rounded">Submissions</Link></li>
          <li><Link href="/profile" className="block py-2 px-4 hover:bg-gray-700 rounded">Profile</Link></li>
          <li><Link href="/practice" className="block py-2 px-4 hover:bg-gray-700 rounded">Practice</Link></li>
          <li><Link href="/custom-contests" className="block py-2 px-4 hover:bg-gray-700 rounded">Custom Contests </Link></li>
        </ul>
      </nav>
      {user && (
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out mt-auto"
        >
          Log out
        </button>
      )}
    </div>
  );
}
