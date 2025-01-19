# Activity Tracker App

A Next.js application for tracking group activities and managing group memberships.

## Features

- User authentication with NextAuth
- Group creation and management
- Activity tracking
- Monthly and yearly activity leaderboards
- Profile management with photo upload
- Real-time activity updates

## Tech Stack

- Next.js 14
- TypeScript
- Prisma ORM
- PostgreSQL
- TailwindCSS
- NextAuth.js

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

For production, update these values accordingly.

## Development

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npx prisma migrate deploy
```

3. Start the development server:
```bash
npm run dev
```

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following:
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - Start Command: `npm start`
   - Environment Variables:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL`
     - Node Version: 18.x
4. Deploy! 