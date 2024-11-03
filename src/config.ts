const dev = process.argv.includes('--dev');

export default {
    feedbackMessage: 'If you have any feedback for us, please let us know in [ES Community](<https://discord.gg/rhe42NjaUr>).',
    manageMessage: 'You can manage this subscription in the </home:1289666783250485251> panel.',
    userPlanTiers: {
        [dev ? 571900 : 572042]: 1,
        [dev ? 486777 : 519819]: 2,
        [dev ? 507657 : 519824]: 3
    },
    guildPlanTiers: { [dev ? 489104 : 519825]: 1 }
};
