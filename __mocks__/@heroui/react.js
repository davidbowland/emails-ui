const React = require('react')

const passThrough = ({ children, className, ...props }) => React.createElement('div', { className, ...props }, children)

const Accordion = passThrough
const AccordionItem = passThrough
const AccordionHeading = passThrough
const AccordionTrigger = passThrough
const AccordionPanel = passThrough
const AccordionBody = passThrough
const AccordionIndicator = passThrough
const Button = ({ children, onPress, isIconOnly, variant, ...props }) =>
  React.createElement('button', { onClick: onPress, ...props }, children)
const Card = passThrough
const CardContent = passThrough
const Chip = ({ children, ...props }) => React.createElement('span', props, children)
const Separator = () => React.createElement('hr')
const Spinner = () => React.createElement('div', { role: 'progressbar' }, 'Loading...')

module.exports = {
  Accordion,
  AccordionBody,
  AccordionHeading,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  Chip,
  Separator,
  Spinner,
}
