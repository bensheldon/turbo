export class Bardo {
  static async preservingPermanentElements(delegate, permanentElementMap, callback) {
    const bardo = new this(delegate, permanentElementMap)
    bardo.enter()
    await callback()
    bardo.leave()
  }

  constructor(delegate, permanentElementMap) {
    this.delegate = delegate
    this.permanentElementMap = permanentElementMap
    this.temporaryContainer = null
  }

  enter() {
    this.createTemporaryContainer()
    for (const id in this.permanentElementMap) {
      const [currentPermanentElement, newPermanentElement] = this.permanentElementMap[id]
      this.delegate.enteringBardo(currentPermanentElement, newPermanentElement)
      this.replaceNewPermanentElementWithPlaceholder(newPermanentElement)
      // Move current permanent element to temporary container to preserve it during page replacement
      this.movePermanentElementToTemporaryContainer(currentPermanentElement)
    }
  }

  leave() {
    for (const id in this.permanentElementMap) {
      const [currentPermanentElement] = this.permanentElementMap[id]
      this.replacePlaceholderWithPermanentElement(currentPermanentElement)
      this.delegate.leavingBardo(currentPermanentElement)
    }
    this.removeTemporaryContainer()
  }

  replaceNewPermanentElementWithPlaceholder(permanentElement) {
    const placeholder = createPlaceholderForPermanentElement(permanentElement)
    permanentElement.replaceWith(placeholder)
  }

  movePermanentElementToTemporaryContainer(permanentElement) {
    // Move element to temporary container to keep it connected to DOM
    // but out of the way during page replacement
    this.temporaryContainer.appendChild(permanentElement)
  }

  replacePlaceholderWithPermanentElement(permanentElement) {
    const placeholder = this.getPlaceholderById(permanentElement.id)
    placeholder?.replaceWith(permanentElement)
  }

  createTemporaryContainer() {
    // Create a temporary container in the document to store permanent elements
    // This keeps them connected to the DOM during the transition
    this.temporaryContainer = document.createElement("div")
    this.temporaryContainer.style.display = "none"
    this.temporaryContainer.setAttribute("data-turbo-permanent-container", "")
    document.documentElement.appendChild(this.temporaryContainer)
  }

  removeTemporaryContainer() {
    if (this.temporaryContainer && this.temporaryContainer.parentNode) {
      this.temporaryContainer.parentNode.removeChild(this.temporaryContainer)
      this.temporaryContainer = null
    }
  }

  getPlaceholderById(id) {
    return this.placeholders.find((element) => element.content == id)
  }

  get placeholders() {
    return [...document.querySelectorAll("meta[name=turbo-permanent-placeholder][content]")]
  }
}

function createPlaceholderForPermanentElement(permanentElement) {
  const element = document.createElement("meta")
  element.setAttribute("name", "turbo-permanent-placeholder")
  element.setAttribute("content", permanentElement.id)
  return element
}
