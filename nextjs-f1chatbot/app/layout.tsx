import "./global.css"

export const metadata = {
    title: "F1GPT",
    description: "The place to go for all your Formula One questions!"
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
