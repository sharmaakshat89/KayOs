function PixelFrame({ children, borderColor = 'green' }) {
  const borderClass = `pixel-border pixel-border-${borderColor}`
  
  return (
    <div className={`pixel-box ${borderClass}`}>
      {children}
    </div>
  )
}

export default PixelFrame