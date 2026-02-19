/**
 * CommandRegistry — registre des types de Command connus.
 *
 * Le gameplay enregistre ses classes de Command au setup.
 * L'Engine utilise le registre pour instancier les commands
 * depuis le CommandLog pendant le replay.
 */

export default class CommandRegistry {

    /**
     * @type {Map<string, Function>} type → classe de Command
     */
    _commands;

    constructor() {
        this._commands = new Map()
    }

    /**
     * Enregistre une classe de Command.
     * La classe DOIT exposer un static `type`.
     *
     * @param {Function} CommandClass - Classe avec static type
     * @throws {Error} Si le type est déjà enregistré ou manquant
     */
    register(CommandClass) {
        const type = CommandClass.type

        if (!type) {
            throw new Error(
                `CommandRegistry: class "${CommandClass.name}" has no static type`
            )
        }

        if (this._commands.has(type)) {
            throw new Error(
                `CommandRegistry: type "${type}" is already registered`
            )
        }

        this._commands.set(type, CommandClass)
    }

    /**
     * Crée une instance de Command à partir d'un type et d'un payload.
     *
     * @param {string} type    - Type de la command
     * @param {Object} payload - Payload à passer au constructeur
     * @returns {Object} Instance de Command
     * @throws {Error} Si le type est inconnu
     */
    create(type, payload) {
        const CommandClass = this._commands.get(type)

        if (!CommandClass) {
            throw new Error(
                `CommandRegistry: unknown command type "${type}"`
            )
        }

        return new CommandClass(payload)
    }

    /**
     * Vérifie si un type est enregistré.
     *
     * @param {string} type
     * @returns {boolean}
     */
    has(type) {
        return this._commands.has(type)
    }
}
