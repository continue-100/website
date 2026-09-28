const nextConfig = {
    transpilePackages: ['lucide-react'],
    pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
    async headers() {
        return [
            {
                source: '/install.sh',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'text/plain; charset=utf-8',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=300, s-maxage=300',
                    },
                ],
            },
        ];
    },
    async redirects() {
        return [
            {
                source: '/docs',
                destination: 'https://docs.prismio.org',
                permanent: false,
            },
            {
                source: '/playground',
                destination: 'https://play.prismio.org',
                permanent: false,
            },
            {
                source: '/packages',
                destination: 'https://packages.prismio.org',
                permanent: false,
            },
            {
                source: '/developers',
                destination: 'https://developers.prismio.org',
                permanent: false,
            },
        ];
    },
}

export default (nextConfig)