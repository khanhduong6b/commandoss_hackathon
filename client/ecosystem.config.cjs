module.exports = {
    apps: [
        {
            name: 'ai-web3-client',
            cwd: './client',
            script: 'npm',
            args: 'run dev',
            env: {
                NODE_ENV: 'development',
                PORT: 5173
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 5173
            },
            instances: 1,
            autorestart: true,
        },
    ]
}; 